import db from '../lib/database.js'
let handler = async (m, { conn, text }) => {
let who
if (m.isGroup) {
who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
} else {
who = m.chat
}
if (!who) return m.reply('⚠️ Por favor, menciona al usuario o cita un mensaje.')
if (who.includes('@lid')) return m.reply('⚠️ Error de identificación (LID). Por favor menciona al usuario (@etiqueta) en lugar de citarlo.')
let user = global.db.data.users[who]
if (!user) {
user = global.db.data.users[who] = { coin: 0 }
}
let dmt
if (text.toLowerCase().includes('all') || text.toLowerCase().includes('todo')) {
dmt = user.coin
} else {
let coinMatch = text.match(/(\d+)/)
if (!coinMatch) return m.reply('⚠️ Por favor, ingresa la cantidad de Coins que deseas quitar.')
dmt = parseInt(coinMatch[0])
}
if (user.coin < dmt) return m.reply(`⚠️ El usuario no tiene suficientes Coins para quitar. Tiene ${user.coin}.`)
user.coin -= dmt
conn.reply(m.chat, `💸 *COINS QUITADOS*\n\n» *Cantidad:* ${dmt}\n» *Usuario:* @${who.split('@')[0]}\n» *Restante:* ${user.coin}`, m, { mentions: [who] })
}
handler.help = ['quitarcoin *<@user>*']
handler.tags = ['owner']
handler.command = ['quitarcoin', 'removecoin', 'removecoins']
handler.rowner = true
export default handler