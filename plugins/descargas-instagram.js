import { igdl } from 'ruhend-scraper'

var handler = async (m, { conn, args, command, usedPrefix, text }) => {

if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Instagram*\n\nEjemplo: !ig https://www.instagram.com/reel/xxxx`, m, rcanal);

if (!args[0].match(/instagram.com|instagr.am|ig.me/g))
return conn.reply(m.chat, '🚩 *ᥒ᥆ ᥱs ᥙᥒ ᥱᥒᥣᥲᥴᥱ ᥎ᥲ́ᥣіძ᥆*', m, rcanal);

conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗖𝗼𝗻𝘁𝗲𝗻𝗶𝗱𝗼 𝗗𝗲 𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺, 𝗘𝘀𝗽𝗲𝗿𝗲 𝗨𝗻 𝗠𝗼𝗺𝗲𝗻𝘁𝗼....', m, {
contextInfo: { 
forwardingScore: 2022, 
isForwarded: true, 
externalAdReply: {
title: packname,
body: '𝙄𝙉𝙎𝙏𝘼𝙂𝙍𝘼𝙈 - 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿',
sourceUrl: redes,
thumbnail: icons
}
}
});

m.react(rwait);

try {

const res = await igdl(args[0]);
const data = res.data;

for (let media of data) {

let type = media.type || (media.url.includes('.mp4') ? 'video' : 'imagen');
let caption = `📸 *CONTENIDO DE INSTAGRAM*\n
👤 *Autor:* ${media.username || 'No disponible'}
📝 *Descripción:* ${media.caption || 'Sin descripción'}
📂 *Tipo:* ${type}
📥 *Calidad:* ${media.quality || 'Automática'}
🔗 *Enlace original:* ${args[0]}

${global.wm}
`;

await conn.sendFile(m.chat, media.url, `instagram.${type == 'video' ? 'mp4' : 'jpg'}`, caption, m);

await new Promise(resolve => setTimeout(resolve, 1000));

}

} catch (e) {
await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m, rcanal);
console.log(e);
}

};

handler.help = ['ig'];
handler.tags = ['descargas'];
handler.command = ['ig', 'instagram'];
handler.register = true;
handler.estrellas = 1;

export default handler;
