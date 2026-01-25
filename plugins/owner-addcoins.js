import db from '../lib/database.js'

let handler = async (m, { conn, text, participants }) => {
    let from = m.sender
    let to

    // 👤 detectar destinatario
    if (m.isGroup) {
        to = m.mentionedJid[0]
            ? m.mentionedJid[0]
            : m.quoted
            ? m.quoted.sender
            : false
    } else {
        to = text ? m.chat : false
    }

    if (!to) return m.reply('⚠️ Menciona al usuario o cita un mensaje.')
    if (to === from) return m.reply('❌ No puedes regalarte dinero a ti mismo.')

    // 🔁 resolver @lid
    if (to.endsWith('@lid') && m.isGroup) {
        const p = participants.find(u => u.lid === to)
        if (p?.id) to = p.id
    }

    // 📦 asegurar usuarios
    let userFrom = global.db.data.users[from]
    let userTo = global.db.data.users[to]

    if (!userFrom) userFrom = global.db.data.users[from] = { coin: 0, bank: 0 }
    if (!userTo) userTo = global.db.data.users[to] = { coin: 0, bank: 0 }

    // 💰 cantidad
    let txt = text.replace('@' + to.split('@')[0], '').trim()
    let amount

    if (txt.toLowerCase().includes('all') || txt.toLowerCase().includes('todo')) {
        amount = (userFrom.coin || 0) + (userFrom.bank || 0)
    } else {
        let clean = txt.replace(/[^\d]/g, '')
        if (!clean) return m.reply('⚠️ Especifica la cantidad a regalar.')
        amount = parseInt(clean)
    }

    if (amount <= 0) return m.reply('⚠️ Cantidad inválida.')

    let total = (userFrom.coin || 0) + (userFrom.bank || 0)
    if (total < amount)
        return m.reply(`⚠️ No tienes suficiente dinero.\n💸 Billetera: ${userFrom.coin}\n🏦 Banco: ${userFrom.bank}`)

    // 🔻 descontar (billetera → banco)
    if (userFrom.coin >= amount) {
        userFrom.coin -= amount
    } else {
        let resto = amount - userFrom.coin
        userFrom.coin = 0
        userFrom.bank -= resto
    }

    // ➕ agregar al receptor (billetera)
    userTo.coin = (userTo.coin || 0) + amount

    m.reply(
        `🎁 *Regalo enviado*\n` +
        `👤 @${from.split('@')[0]} → @${to.split('@')[0]}\n` +
        `💸 Monto: ${amount}`,
        null,
        { mentions: [from, to] }
    )
}

handler.help = ['regalarcoin <@user> <cantidad|all>']
handler.tags = ['rpg']
handler.command = ['regalarcoin', 'give', 'pay']
handler.group = true
handler.register = true

export default handler
