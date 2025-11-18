import { fbdl } from 'ruhend-scraper'

var handler = async (m, { conn, args, command, usedPrefix, text }) => {

const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command);

async function reportError(e) {
await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m, rcanal);
console.log(`⁖💚꙰ 𝙴𝚁𝚁𝙾𝚁 𝙴𝙽: ${usedPrefix + command} ⚠️\n`);
console.log(e);
}

if (isCommand7) {

if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de facebook*\n\nEjemplo: !fb https://fb.watch/kAOXy3wf2L/?mibextid=Nif5oz`, m, rcanal);

if (!args[0].match(/www.facebook.com|fb.watch|web.facebook.com|business.facebook.com|video.fb.com/g)) 
return conn.reply(m.chat, '🚩 *ᥒ᥆ ᥱs ᥙᥒ ᥱᥒᥣᥲᥴᥱ ᥎ᥲ́ᥣіძ᥆*', m, rcanal);

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
});

m.react(rwait);

try {

const res = await fbdl(args[0]);
const data = res.data;

let videoUrl = data.video_hd || data.hd || data.video_sd || data.sd || data.url;

if (!videoUrl && Array.isArray(data) && data.length > 0) {
videoUrl = data[0].url || data[0];
}

if (!videoUrl || typeof videoUrl !== 'string') {
throw new Error('No se pudo extraer un enlace de video válido.');
}

let caption = `📹 *VIDEO DESCARGADO DE FACEBOOK*\n
✨ *Título:* ${data.title || 'No disponible'}
🧑‍💻 *Autor:* ${data.author || 'No disponible'}
⏱️ *Duración:* ${data.duration || 'No disponible'}
🎞️ *Calidad:* ${data.quality || 'Automática'}
🔗 *Enlace original:* ${args[0]}

${global.wm}
`;

await conn.sendFile(m.chat, videoUrl, 'facebook.mp4', caption, m);

} catch (e) {
reportError(e);
}
}
};

handler.help = ['fb'];
handler.tags = ['descargas'];
handler.command = ['fb', 'facebook'];
handler.register = true;
handler.estrellas = 1;

export default handler;
