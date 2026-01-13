import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'
const styleText = (text) => {
const map = {
'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
'0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
};
return text.split('').map(char => map[char] || char).join('');
}
let handler = m => m
handler.before = async function (m, { conn, groupMetadata }) {
if (!m.messageStubType || !m.isGroup) return
let chat = global.db.data.chats[m.chat]
let usuario = m.sender.split('@')[0]
let fkontak = null
try {
const res = await fetch('https://i.postimg.cc/6562JdR7/Hoshino-Ruby-(2).jpg')
const thumb2 = await res.buffer()
fkontak = {
key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
message: {
locationMessage: {
name: styleText('Notificaciones del Grupo'),
jpegThumbnail: thumb2
}
},
participant: '0@s.whatsapp.net'
}
} catch (e) {
console.error(e)
}
let text = ''
let mentions = [m.sender]
if (chat.detect && m.messageStubType == 21) {
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐚𝐦𝐛𝐢𝐨́ 𝐞𝐥 𝐍𝐨𝐦𝐛𝐫𝐞   𖤝        
꒰꒰ 📝 𝐀𝐡𝐨𝐫𝐚 𝐬𝐞 𝐥𝐥𝐚𝐦𝐚 Ი꯭ᰍ
> ${styleText(m.messageStubParameters[0])}`
} else if (chat.detect && m.messageStubType == 22) {
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐚𝐦𝐛𝐢𝐨́ 𝐥𝐚 𝐈𝐦𝐚𝐠𝐞𝐧   𖤝        
꒰꒰ 🖼️ 𝐅𝐨𝐭𝐨 𝐀𝐜𝐭𝐮𝐚𝐥𝐢𝐳𝐚𝐝𝐚 Ი꯭ᰍ
> 🫧 ${styleText('El icono del grupo ha cambiado')}`
} else if (chat.detect && m.messageStubType == 24) {
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐚𝐦𝐛𝐢𝐨́ 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐜𝐢𝐨́𝐧   𖤝        
꒰꒰ 📑 𝐈𝐧𝐟𝐨 𝐀𝐜𝐭𝐮𝐚𝐥𝐢𝐳𝐚𝐝𝐚 Ი꯭ᰍ
> 📝 ${styleText('La descripción del grupo es nueva')}`
} else if (chat.detect && m.messageStubType == 23) {
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐑𝐞𝐬𝐭𝐚𝐛𝐥𝐞𝐜𝐢𝐨́ 𝐄𝐧𝐥𝐚𝐜𝐞   𖤝        
꒰꒰ 🔗 𝐋𝐢𝐧𝐤 𝐀𝐧𝐮𝐥𝐚𝐝𝐨 Ი꯭ᰍ
> 🚫 ${styleText('El enlace anterior ya no sirve')}`
} else if (chat.detect && m.messageStubType == 25) {
let type = m.messageStubParameters[0] == 'on' ? '𝐒𝐨𝐥𝐨 𝐀𝐝𝐦𝐢𝐧𝐬' : '𝐓𝐨𝐝𝐨𝐬'
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐀𝐥𝐭𝐞𝐫𝐨́ 𝐀𝐣𝐮𝐬𝐭𝐞𝐬   𖤝        
꒰꒰ ⚙️ 𝐀𝐡𝐨𝐫𝐚 𝐄𝐝𝐢𝐭𝐚𝐧 Ი꯭ᰍ
> 🔓 ${styleText(type)}`
} else if (chat.detect && m.messageStubType == 26) {
let action = m.messageStubParameters[0] == 'on' ? '𝐂𝐞𝐫𝐫𝐨́ 𝐞𝐥 𝐆𝐫𝐮𝐩𝐨' : '𝐀𝐛𝐫𝐢𝐨́ 𝐞𝐥 𝐆𝐫𝐮𝐩𝐨'
let msg = m.messageStubParameters[0] == 'on' ? 'Solo Admins escriben' : 'Todos pueden escribir'
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ ${action}   𖤝        
꒰꒰ 💬 𝐄𝐬𝐭𝐚𝐝𝐨 𝐝𝐞𝐥 𝐂𝐡𝐚𝐭 Ი꯭ᰍ
> 📣 ${styleText(msg)}`
} else if (chat.detect && m.messageStubType == 29) {
let nuevoAdmin = m.messageStubParameters[0]
mentions.push(nuevoAdmin)
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐃𝐢𝐨 𝐀𝐝𝐦𝐢𝐧 𝐚   𖤝        
> 🫡 @${nuevoAdmin.split('@')[0]}
꒰꒰ 👑 𝐍𝐮𝐞𝐯𝐨 𝐀𝐝𝐦𝐢𝐧 Ი꯭ᰍ`
} else if (chat.detect && m.messageStubType == 30) {
let exAdmin = m.messageStubParameters[0]
mentions.push(exAdmin)
text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐐𝐮𝐢𝐭𝐨́ 𝐀𝐝𝐦𝐢𝐧 𝐚   𖤝        
> 😔 @${exAdmin.split('@')[0]}
꒰꒰ 📉 𝐃𝐞𝐠𝐫𝐚𝐝𝐚𝐝𝐨 Ი꯭ᰍ`
}
if (text) {
await conn.sendMessage(m.chat, {
text: text,
mentions: mentions
}, { quoted: fkontak || m })
}
}
export default handler