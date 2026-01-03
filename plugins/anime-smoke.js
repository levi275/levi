import axios from 'axios';

let handler = async (m, { conn }) => {
    const smokeGifs = [
        'https://i.pinimg.com/originals/5c/8e/bb/5c8ebbfa78bef8b0a51259d10fbbc929.gif',
        'https://i.pinimg.com/originals/29/7c/bb/297cbb4ffe4b7a96cbc1d913917dad27.gif',
        'https://i.pinimg.com/originals/fb/56/48/fb5648dc6e39b7b724cb0daf3693610f.gif',
        'https://i.pinimg.com/originals/70/56/56/705656e8c01d3668bc496bef826a21f6.gif',
        'https://i.pinimg.com/originals/b4/f9/35/b4f9350ae84bc8f0dd76c51f85ee5392.gif',
        'https://i.pinimg.com/originals/f0/1e/4b/f01e4b59c072d8857f22be2a6a9a55b9.gif',
        'https://i.pinimg.com/originals/87/cb/bf/87cbbf238f7ec3a6b6577fea262ac484.gif',
        'https://i.pinimg.com/originals/29/92/fb/2992fb9c44cdc817e6cbc0782fbc6276.gif'
    ];

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;
    let nameSender = conn.getName(m.sender);
    let nameTarget = conn.getName(who);

    let caption = who === m.sender 
        ? `\`${nameSender}\` *está fumando* 🚬.` 
        : `\`${nameSender}\` *está fumando con* \`${nameTarget}\` 🚬.`;
    
    const randomGif = smokeGifs[Math.floor(Math.random() * smokeGifs.length)];

    await m.react('🚬');

    try {
        // DESCARGA USANDO TUS HEADERS DE PINTEREST
        const res = await axios.get(randomGif, {
            responseType: 'arraybuffer',
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'referer': 'https://id.pinterest.com/'
            }
        });

        const buffer = Buffer.from(res.data, 'utf-8');

        // MÉTODO ALTERNATIVO: Usar conn.sendFile si tu bot lo tiene (es más potente)
        // Si no tienes sendFile, usa sendMessage abajo
        if (conn.sendFile) {
            await conn.sendFile(m.chat, buffer, 'error.gif', caption, m, true, {
                mimetype: 'image/gif',
                asGif: true
            });
        } else {
            // Si usas sendMessage estándar:
            await conn.sendMessage(m.chat, { 
                video: buffer, 
                caption: caption, 
                gifPlayback: true,
                mimetype: 'video/mp4' 
            }, { quoted: m });
        }

    } catch (e) {
        console.error(e);
        m.reply('Error al obtener el GIF de Pinterest. Intenta de nuevo.');
    }
};

handler.help = ['smoke', 'fumar'];
handler.tags = ['anime'];
handler.command = ['smoke', 'fumar'];
handler.group = true;

export default handler;