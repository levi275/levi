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
        console.log(`Intentando descargar: ${randomGif}`); // Log para consola

        const response = await axios({
            method: 'get',
            url: randomGif,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://www.pinterest.com/'
            },
            timeout: 10000 // Si tarda más de 10 seg, aborta
        });

        // Convertimos a Buffer correctamente
        const buffer = Buffer.from(response.data);

        if (buffer.length < 100) {
            throw new Error('El archivo descargado es demasiado pequeño o está corrupto.');
        }

        // ENVIAR COMO VIDEO (Para que sea GIF con reproducción automática)
        await conn.sendMessage(m.chat, { 
            video: buffer, 
            caption: caption, 
            gifPlayback: true,
            mentions: [who, m.sender],
            mimetype: 'video/mp4' 
        }, { quoted: m });

    } catch (error) {
        console.error("ERROR DETECTADO:", error.message);
        
        // PLAN DE EMERGENCIA: Si falla como video, enviarlo como imagen/GIF simple
        try {
            console.log("Reintentando como imagen GIF simple...");
            await conn.sendMessage(m.chat, { 
                image: { url: randomGif }, 
                caption: caption + "\n\n*(Enviado como imagen porque el proceso de video falló)*",
                mimetype: 'image/gif'
            }, { quoted: m });
        } catch (e2) {
            m.reply('No pude procesar el GIF de Pinterest. Es probable que el servidor del bot no tenga FFmpeg instalado para convertir GIFs de 9MB.');
        }
    }
};

handler.help = ['smoke', 'fumar'];
handler.tags = ['anime'];
handler.command = ['smoke', 'fumar'];
handler.group = true;

export default handler;