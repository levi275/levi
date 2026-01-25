import db from '../lib/database.js'

async function handler(m, { conn, args, usedPrefix, command, participants }) {
    let who
    if (m.isGroup) {
        who = m.mentionedJid[0]
            ? m.mentionedJid[0]
            : m.quoted
            ? m.quoted.sender
            : false
    } else {
        who = m.chat
    }

    if (!who)
        return m.reply(`${emoji} Etiqueta o responde al usuario al que quieres transferir.`)

    // Resolver sender
    let senderJid = m.sender
    if (m.sender.endsWith('@lid') && m.isGroup) {
        const p = participants.find(p => p.lid === m.sender)
        if (p?.id) senderJid = p.id
    }

    // Resolver target
    let targetJid = who
    if (who.endsWith('@lid') && m.isGroup) {
        const p = participants.find(p => p.lid === who)
        if (p?.id) targetJid = p.id
    }

    if (targetJid === senderJid)
        return m.reply('❌ No puedes enviarte dinero a ti mismo.')

    const amountText = args.find(a => !a.startsWith('@') && isNumber(a))
    if (!amountText)
        return m.reply(`❌ Debes especificar la cantidad.\nEj: ${usedPrefix + command} 1000 @usuario`)

    const count = Math.max(1, parseInt(amountText))

    // Asegurar usuarios
    if (!global.db.data.users[senderJid])
        global.db.data.users[senderJid] = { coin: 0, bank: 0 }

    if (!global.db.data.users[targetJid])
        return m.reply('❌ El usuario no está en mi base de datos.')

    let sender = global.db.data.users[senderJid]
    let target = global.db.data.users[targetJid]

    sender.coin ??= 0
    sender.bank ??= 0
    target.coin ??= 0

    let total = sender.coin + sender.bank
    if (total < count)
        return m.reply(`⚠️ No tienes suficiente dinero.\n💸 Billetera: ${sender.coin}\n🏦 Banco: ${sender.bank}`)

    // 🔻 quitar primero billetera, luego banco
    if (sender.coin >= count) {
        sender.coin -= count
    } else {
        let resto = count - sender.coin
        sender.coin = 0
        sender.bank -= resto
    }

    // 🔺 sumar al receptor (billetera)
    target.coin += count

    m.reply(
        `✅ *Transferencia exitosa*\n\n` +
        `💸 Enviaste *${count.toLocaleString()} ${m.moneda}*\n` +
        `👤 A: @${targetJid.split('@')[0]}\n\n` +
        `📊 Tu saldo:\n` +
        `• Billetera: ${sender.coin.toLocaleString()}\n` +
        `• Banco: ${sender.bank.toLocaleString()}`,
        null,
        { mentions: [targetJid] }
    )
}

handler.help = ['pay <cantidad> @usuario']
handler.tags = ['rpg']
handler.command = ['pay', 'transfer']
handler.group = true
handler.register = true

export default handler

function isNumber(x) {
    if (typeof x === 'string') x = x.trim()
    return !isNaN(x) && x !== ''
}
