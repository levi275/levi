import { igdl } from 'ruhend-scraper'
import axios from 'axios'
import * as cheerio from 'cheerio'

async function getInstagramMetadata(url) {
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' }
        });

        const $ = cheerio.load(res.data);
        const script = $('script[type="application/ld+json"]').html();
        if (!script) return null;

        const json = JSON.parse(script);

        return {
            author: json.author ? json.author.alternateName : null,
            authorName: json.author ? json.author.name : null,
            caption: json.caption || null,
            uploadDate: json.uploadDate || null,
            thumbnail: json.thumbnailUrl || null
        };

    } catch {
        return null;
    }
}

var handler = async (m, { conn, args, command, usedPrefix, text }) => {

if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Instagram*`, m, rcanal);

conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗖𝗼𝗻𝘁𝗲𝗻𝗶𝗱𝗼 𝗗𝗲 𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺....', m, {
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

const meta = await getInstagramMetadata(args[0]);

const res = await igdl(args[0]);
const data = res.data;

for (let media of data) {

let caption = `📸 *CONTENIDO DE INSTAGRAM*\n
👤 *Autor:* ${meta?.authorName || meta?.author || 'No disponible'}
📝 *Descripción:* ${meta?.caption || 'Sin descripción'}
📅 *Fecha:* ${meta?.uploadDate || 'No disponible'}
📂 *Tipo:* ${media.url.includes('.mp4') ? 'Video' : 'Imagen'}
🔗 *Enlace original:* ${args[0]}

${global.wm}
`;

await conn.sendFile(m.chat, media.url, 'instagram.mp4', caption, m);
await new Promise(r => setTimeout(r, 1000));

}

} catch (e) {
console.log(e)
await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m, rcanal);
}

};

handler.command = ['ig','instagram'];
export default handler;
