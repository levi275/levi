import db from '../lib/database.js'
let handler = async (m, { conn, text }) => {
let who
if (m.isGroup) {
who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
} else {
who = m.chat
}
if (!who) return m.reply('⚠️ Menciona al usuario o cita un mensaje.')
if (who.endsWith('@lid')) {
try {
const pp = await conn.groupMetadata(m.chat)
const dbUser = pp.participants.find(u => u.lid === who)
if (dbUser) who = dbUser.id
} catch (e) {}
}
let user = global.db.data.users[who]
if (!user) {
user = global.db.data.users[who] = { coin: 0 }
}
let txt = text.replace('@' + who.split`@`[0], '').trim()
let dmt
if (txt.toLowerCase().includes('all') || txt.toLowerCase().includes('todo')) {
dmt = user.coin
} else {
let cleanNum = txt.replace(/[^\d]/g, '')
if (!cleanNum) return m.reply('⚠️ Ingresa la cantidad a quitar.')
dmt = parseInt(cleanNum)
}
if (user.coin < dmt) return m.reply(`⚠️ No tiene suficientes coins. Tiene: ${user.coin}`)
user.coin -= dmt
m.reply(`💸 *Quitado:*\n» ${dmt}\n@${who.split('@')[0]}, te han quitado ${dmt} 💸`, null, { mentions: [who] })
}
handler.help = ['quitarcoin *<@user>*']
handler.tags = ['owner']
handler.command = ['quitarcoin', 'removecoin', 'removecoins']
handler.rowner = true
export default handler