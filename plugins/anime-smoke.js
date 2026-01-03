import axios from 'axios'

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
        // Usamos axios con un User-Agent para que Pinterest no nos bloquee la descarga
        const response = await axios.get(randomGif, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const buffer = Buffer.from(response.data, 'binary');

        // IMPORTANTE: Enviamos como VIDEO pero con gifPlayback
        // Esto obliga a WhatsApp a convertir el GIF en un bucle infinito
        await conn.sendMessage(m.chat, { 
            video: buffer, 
            gifPlayback: true, 
            caption: caption, 
            mentions: [who, m.sender],
            mimetype: 'video/mp4' // Aunque sea un GIF, le decimos que lo trate como video
        }, { quoted: m });

    } catch (e) {
        console.error("Error enviando GIF de Pinterest:", e);
        // Si falla como video, intentamos enviarlo como imagen/gif (como último recurso)
        try {
            await conn.sendMessage(m.chat, { 
                image: { url: randomGif }, 
                caption: caption, 
                mimetype: 'image/gif' 
            }, { quoted: m });
        } catch (e2) {
            m.reply('No pude cargar el GIF, parece que el enlace está temporalmente caído.');
        }
    }
};

handler.help = ['smoke', 'fumar'];
handler.tags = ['anime'];
handler.command = ['smoke', 'fumar'];
handler.group = true;

export default handler;