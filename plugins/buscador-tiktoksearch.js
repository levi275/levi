import axios from 'axios'
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = (await import("@whiskeysockets/baileys")).default

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text) return conn.reply(m.chat, '🍟 *¿Qué deseas buscar en TikTok? Ingresa un texto.*', m)

const toFancy = str => {
const map = { 'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ', 'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴', 'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x', 'y': 'ᥡ', 'z': 'z' }
return str.split('').map(c => map[c] || c).join('')
}

async function shuffleArray(array) {
for (let i = array.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1))
[array[i], array[j]] = [array[j], array[i]]
}
}

try {
await m.react('🕒')

let searchResults = []
try {
let { data: response } = await axios.post('https://www.tikwm.com/api/feed/search', new URLSearchParams({ keywords: text, count: 12, cursor: 0, web: 1, hd: 1 }), { headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "Mozilla/5.0" } })
if (response.data?.videos) {
searchResults = response.data.videos.map(v => ({
title: v.title,
nowm: v.play.startsWith('http') ? v.play : `https://www.tikwm.com${v.play}`,
cover: v.cover.startsWith('http') ? v.cover : `https://www.tikwm.com${v.cover}`,
author: v.author.nickname,
url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
}))
}
} catch (e) {
try {
let { data: response } = await axios.get('https://api.agatz.xyz/api/tiktoksearch?message=' + text)
searchResults = response.data.map(v => ({
title: v.title,
nowm: v.nowm || v.url,
cover: v.cover || 'https://i.imgur.com/95t44C0.png',
author: 'TikTok User',
url: v.url
}))
} catch (e2) {}
}

if (!searchResults.length) return conn.reply(m.chat, '❌ No se encontraron videos.', m)

shuffleArray(searchResults)
let result = searchResults[0]

let mediaMessage
try {
mediaMessage = await prepareWAMessageMedia({ video: { url: result.nowm } }, { upload: conn.waUploadToServer })
} catch (e) {
mediaMessage = await prepareWAMessageMedia({ image: { url: result.cover } }, { upload: conn.waUploadToServer })
}

const messageContent = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({
text: `${toFancy("✦ Rᥱsᥙᥣ𝗍ᥲძ᥆:")} ${text}\n\n📝 *Titulo:* ${result.title}\n👤 *Autor:* ${result.author}`
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: "🔎 TikTok Search • " + toFancy("Bot")
}),
header: proto.Message.InteractiveMessage.Header.create({
hasMediaAttachment: true,
...mediaMessage
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [
{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🔗 Ver en TikTok", url: result.url, merchant_url: result.url }) },
{ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 Copiar Enlace", copy_code: result.url }) },
{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔄 Siguiente Resultado", id: `${usedPrefix + command} ${text}` }) }
]
})
})
}
}
}, { quoted: m })

await conn.relayMessage(m.chat, messageContent.message, { messageId: messageContent.key.id })
await m.react('✅')

} catch (error) {
await m.react('❌')
console.error(error)
conn.reply(m.chat, 'Ocurrió un error al procesar el video. Intenta de nuevo.', m)
}
}

handler.help = ['tiktoksearch <txt>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true

export default handler
