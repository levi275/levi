import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { webp2png } from '../lib/webp2mp4.js'

let handler = async (m, { conn, args }) => {
let stiker = null
let userId = m.sender
let packstickers = global.db.data.users[userId] || {}
let texto1 = packstickers.text1 ?? global.packsticker
let texto2 = packstickers.text2 ?? global.packsticker2

let q = m.quoted ? m.quoted : m
let mime = q.mimetype || q.mediaType || ''
let txt = args.join(' ')

try {

if (/webp|image|video/.test(mime)) {

if (/video/.test(mime) && q.seconds > 15)
return conn.reply(m.chat,'❌ El video no puede durar más de *15 segundos*',m)

let buffer = await downloadMedia(q, conn)
if (!buffer) throw new Error('No se pudo descargar el archivo')

await m.react('🧃')

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

if (!stiker) throw new Error('No se pudo generar el sticker')

await conn.sendMessage(
m.chat,
{ sticker: stiker },
{ quoted: m }
)

await m.react('🧃')

} catch (e) {
await m.react('✖️')
await conn.reply(m.chat,'⚠ Error: ' + e.message,m)
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
