import db from '../lib/database.js'
let handler = async (m, { conn, text, usedPrefix, command }) => {
let who
if (m.isGroup) {
who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
} else {
who = m.chat
}
if (!who) return m.reply('⚠️ Por favor, menciona al usuario o cita un mensaje.')
if (who.includes('@lid')) return m.reply('⚠️ Error de identificación (LID). Por favor menciona al usuario (@etiqueta) en lugar de citarlo para asegurar la transacción.')
let user = global.db.data.users[who]
if (!user) {
user = global.db.data.users[who] = { coin: 0 }
}
let coinsMatch = text.match(/(\d+)/)
if (!coinsMatch) return m.reply('⚠️ Por favor, ingresa la cantidad que deseas añadir.')
let dmt = parseInt(coinsMatch[0])
if (dmt < 1) return m.reply('⚠️ La cantidad mínima es 1.')
user.coin += dmt
conn.reply(m.chat, `💸 *COINS AÑADIDOS*\n\n» *Cantidad:* ${dmt}\n» *Usuario:* @${who.split('@')[0]}\n» *Total:* ${user.coin}`, m, { mentions: [who] })
}
handler.help = ['addcoins *<@user> <cant>*']
handler.tags = ['owner']
handler.command = ['añadircoin', 'addcoin', 'addcoins']
handler.rowner = true
export default handler