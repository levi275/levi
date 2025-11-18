import { fbdl } from 'ruhend-scraper'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

var handler = async (m, { conn, args, command, usedPrefix, text }) => {

const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command)

async function reportError(e) {
await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝙍𝙾𝚁`, m, rcanal)
console.log(e)
}

async function scrapeMetadata(pageUrl) {
try {
const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
const html = await resp.text()
const $ = cheerio.load(html)
const getMeta = (name, attr = 'content') =>
$(`meta[property="${name}"]`).attr(attr) ||
$(`meta[name="${name}"]`).attr(attr) ||
null
return {
title: getMeta('og:title') || getMeta('twitter:title'),
description: getMeta('og:description') || getMeta('twitter:description'),
siteName: "Facebook"
}
} catch {
return { title: null, description: null, siteName: "Facebook" }
}
}

if (isCommand7) {

if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de facebook*`, m, rcanal)

if (!args[0].match(/www.facebook.com|fb.watch|web.facebook.com|business.facebook.com|video.fb.com/g)) 
return conn.reply(m.chat, '🚩 *ᥒ᥆ ᥱs ᥙᥒ ᥱᥒᥣᥲᥴᥱ ᥎ᥲ́ᥣіძ᥆*', m, rcanal)

conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗩𝗶𝗱𝗲𝗼 𝗗𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸, 𝗘𝘀𝗽𝗲𝗿𝗲 𝗨𝗻 𝗠𝗼𝗺𝗲𝗻𝘁𝗼....', m, {
contextInfo: { 
forwardingScore: 2022, 
isForwarded: true, 
externalAdReply: {
title: packname,
body: '𝙁𝘼𝘾𝙀𝘽𝙊𝙊𝙆 - 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿',
sourceUrl: redes,
thumbnail: icons
}
}
})

m.react(rwait)

try {

const fb = await fbdl(args[0])
if (!fb?.data?.length) throw new Error('No se obtuvo video.')
const video = fb.data[0]
const videoUrl = video.url

const meta = await scrapeMetadata(args[0])

let caption = `📹 *VIDEO DESCARGADO DE FACEBOOK*\n
✨ *Título:* ${meta.title || 'No disponible'}
📝 *Descripción:* ${meta.description || 'No disponible'}
🌐 *Sitio:* Facebook
🔗 *Enlace original:* ${args[0]}

${global.wm}
`

await conn.sendFile(m.chat, videoUrl, 'facebook.mp4', caption, m)

} catch (e) {
reportError(e)
}
}
}

handler.help = ['fb']
handler.tags = ['descargas']
handler.command = ['fb', 'facebook']
handler.register = true
handler.estrellas = 1

export default handler
