import pkg from '@whiskeysockets/baileys'
import fs from 'fs'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = pkg

Array.prototype.getRandom = function () {
return this[Math.floor(Math.random() * this.length)]
}

var handler = m => m

handler.all = async function (m) {

const conn = this

global.getBuffer = async function getBuffer(url, options) {
try {
options ? options : {}
var res = await axios({
method: "get",
url,
headers: {
'DNT': 1,
'User-Agent': 'GoogleBot',
'Upgrade-Insecure-Request': 1
},
...options,
responseType: 'arraybuffer'
})
return res.data
} catch (e) {
console.log(`Error : ${e}`)
}
}

const iconUrls = [
"https://files.catbox.moe/ahp3bc.jpeg","https://files.catbox.moe/ffkx61.jpg",
"https://files.catbox.moe/uc272d.webp","https://files.catbox.moe/nuoard.jpg",
"https://files.catbox.moe/edsflw.jpg","https://files.catbox.moe/nuoard.jpg",
"https://files.catbox.moe/ilkgfh.webp","https://files.catbox.moe/fslr4h.jpg",
"https://files.catbox.moe/k25pcl.jpg","https://files.catbox.moe/5qglcn.jpg",
"https://files.catbox.moe/nvhomc.jpeg","https://files.catbox.moe/d81jgr.jpg",
"https://files.catbox.moe/k25pcl.jpg","https://files.catbox.moe/6x9q51.jpg",
"https://files.catbox.moe/i7vsnr.jpg","https://files.catbox.moe/e9zgbu.jpg",
"https://files.catbox.moe/nuoard.jpg","https://files.catbox.moe/jm6j5b.jpeg",
"https://files.catbox.moe/jobvjq.jpg","https://files.catbox.moe/iph9xr.jpeg",
"https://files.catbox.moe/z962x9.jpg","https://files.catbox.moe/k8griq.jpeg",
"https://files.catbox.moe/fslr4h.jpg","https://files.catbox.moe/104xtw.jpeg",
"https://files.catbox.moe/ffkx61.jpg","https://files.catbox.moe/pjuo2b.jpg",
"https://files.catbox.moe/jobvjq.jpg","https://files.catbox.moe/7bn1pf.jpg",
"https://files.catbox.moe/z962x9.jpg","https://files.catbox.moe/fe6pw6.jpeg",
"https://files.catbox.moe/fslr4h.jpg"
]

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
}

const iconUrl = pickRandom(iconUrls)
global.icono = await getBuffer(iconUrl)

global.fkontak = {
key: {
participants: "0@s.whatsapp.net",
remoteJid: "status@broadcast",
fromMe: false,
id: "Halo"
},
message: {
contactMessage: {
vcard: `BEGIN:VCARD
VERSION:3.0
N:Sy;Bot;;;
FN:y
item1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}
item1.X-ABLabel:Ponsel
END:VCARD`
}
},
participant: "0@s.whatsapp.net"
}

global.creador = 'Wa.me/18294868853'
global.ofcbot = conn.user?.jid?.split('@')[0] || 'Bot'
global.asistencia = 'Wa.me/18294868853'

global.namechannel = '⏤͟͞ू⃪፝͜⁞⟡『 𝐓͢ᴇ𝙖፝ᴍ⃨ 𝘾𝒉꯭𝐚𝑛𝑛𝒆𝑙: 𝑹ᴜ⃜ɓ𝑦-𝑯ᴏ𝒔𝑯𝙞꯭𝑛𝒐 』࿐⟡'
global.namechannel2 = '⟡『 𝐓𝐞𝐚𝐦 𝐂𝐡𝐚𝐧𝐧𝐞𝐥: 𝑹𝒖𝒃𝒚-𝑯𝒐𝒔𝒉𝒊𝒏𝒐 』⟡'
global.namegrupo = '⏤͟͞ू⃪ 𝑹𝒖𝒃𝒚-𝑯𝒐𝒔𝒉𝒊𝒏𝒐-𝐵ot ⌬⃝𓆩⚘𓆪 𝐎𝐟𝐟𝐢cial'
global.namecomu = '⏤͟͞ू⃪ 𝑹𝒖𝒃𝒚-𝑯𝒐𝒔𝑯𝒊𝒏𝒐 ✦⃝𖤐 𝑪𝒐𝒎𝒎𝒖𝒏𝒊𝒕𝒚'

global.listo = '❀ *Aquí tienes ฅ^•ﻌ•^ฅ*'

global.fotoperfil = await conn.profilePictureUrl(m.sender,'image').catch(_=>'https://files.catbox.moe/xr2m6u.jpg')

global.emoji = '🍨'
global.emoji2 = '🍭'
global.emoji3 = '🌺'
global.emoji4 = '💗'
global.emoji5 = '🍡'
global.emojis = [emoji, emoji2, emoji3, emoji4].getRandom()

global.packsticker = `${m.pushName || 'Anónimo'}`
global.packsticker2 = `𝚁𝚄𝙱𝚈 𝙱𝙾𝚃 𝙼𝙳 ˃ 𖥦 ˂`

}

export default handler
