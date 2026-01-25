import db from '../lib/database.js'

let handler = async (m, { conn, text }) => {
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

    if (!who) return m.reply('⚠️ Menciona al usuario o cita un mensaje.')

    if (who.endsWith('@lid')) {
        try {
            const pp = await conn.groupMetadata(m.chat)
            const dbUser = pp.participants.find(u => u.lid === who)
            if (dbUser) who = dbUser.id
        } catch {}
    }

    let user = global.db.data.users[who]
    if (!user) {
        user = global.db.data.users[who] = { coin: 0, bank: 0 }
    }

    let txt = text.replace('@' + who.split`@`[0], '').trim()
    let dmt

    if (txt.toLowerCase().includes('all') || txt.toLowerCase().includes('todo')) {
        dmt = (user.coin || 0) + (user.bank || 0)
    } else {
        let cleanNum = txt.replace(/[^\d]/g, '')
        if (!cleanNum) return m.reply('⚠️ Ingresa la cantidad a quitar.')
        dmt = parseInt(cleanNum)
    }

    let total = (user.coin || 0) + (user.bank || 0)
    if (total < dmt) {
        return m.reply(`⚠️ No tiene suficiente dinero.\n💸 Billetera: ${user.coin}\n🏦 Banco: ${user.bank}`)
    }

    // 🔥 quitar primero de la billetera
    let fromWallet = Math.min(user.coin, dmt)
    user.coin -= fromWallet
    dmt -= fromWallet

    // 🔥 si falta, quitar del banco
    if (dmt > 0) {
        user.bank -= dmt
    }

    m.reply(
        `💸 *Dinero retirado*\n@${who.split('@')[0]} perdió dinero.`,
        null,
        { mentions: [who] }
    )
}

handler.help = ['quitarcoin <@user> <cantidad|all>']
handler.tags = ['owner']
handler.command = ['quitarcoin', 'removecoin', 'removecoins']
handler.rowner = true

export default handler
