import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn, args }) => {
let stiker
let userId = m.sender
let data = global.db.data.users[userId] || {}
let texto1 = data.text1 ?? global.packsticker
let texto2 = data.text2 ?? global.packsticker2

let q = m.quoted ? m.quoted : m
let mime = q.mimetype || q.mediaType || ''
let txt = args.join(' ')

try {

if (/image|video|webp/.test(mime)) {

if (/video/.test(mime) && q.seconds > 15)
return conn.reply(m.chat,'❌ El video no puede durar más de *15 segundos*',m)

await m.react('🧃')

let buffer = await downloadMedia(q, conn)
if (!buffer) throw 'No se pudo descargar el archivo'

let marca = txt
? txt.split(/[\u2022|]/).map(v => v.trim())
: [texto1, texto2]

stiker = await sticker(buffer, false, marca[0], marca[1])

} else if (args[0] && isUrl(args[0])) {

await m.react('🧃')
stiker = await sticker(false, args[0], texto1, texto2)

} else {
return conn.reply(
m.chat,
'❌ Responde o etiqueta una imagen / gif / video para convertirlo en sticker.',
m
)
}

if (!stiker) throw 'No se pudo generar el sticker'

await conn.sendMessage(
m.chat,
{ sticker: stiker },
{
quoted: m,
contextInfo: {
forwardingScore: 2022,
isForwarded: true,
externalAdReply: {
title: 'ϟϟ(๑⚈ ․̫ ⚈๑)ᵖⁱᵏᵃ ᵖⁱᵏᵃ',
body: '¡aquí tienes tu sticker!',
thumbnail: icons,
sourceUrl: redes,
mediaType: 1,
renderLargerThumbnail: true
}
}
}
)

await m.react('🧃')

} catch (e) {
await m.react('✖️')
await conn.reply(m.chat,'⚠ Error: ' + e.toString(),m)
}
}

handler.help = ['sticker']
handler.tags = ['sticker']
handler.command = ['s','sticker']

export default handler

async function downloadMedia(q, conn) {
if (typeof q.download === 'function') {
return await q.download()
}
if (q.message) {
return await conn.downloadMediaMessage(q)
}
return null
}

const isUrl = text => {
return /^https?:\/\/.+\.(jpe?g|png|gif|webp)$/i.test(text)
}
