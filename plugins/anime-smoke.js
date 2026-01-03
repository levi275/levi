let handler = async (m, { conn }) => {
    // -------------------------------------------------------------------------------------
    // ÁREA DE CONFIGURACIÓN
    // Aquí puedes añadir o borrar links fácilmente. Solo asegúrate de ponerlos entre comillas 
    // y separados por una coma.
    // -------------------------------------------------------------------------------------
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
    // -------------------------------------------------------------------------------------

    // 1. Identificar a quién se dirige la acción (mención, respuesta o uno mismo)
    let who;
    if (m.mentionedJid.length > 0) {
        who = m.mentionedJid[0];
    } else if (m.quoted) {
        who = m.quoted.sender;
    } else {
        who = m.sender;
    }

    // 2. Obtener nombres
    let nameSender = conn.getName(m.sender);
    let nameTarget = conn.getName(who);

    // 3. Crear el texto del mensaje
    let caption;
    if (who === m.sender) {
        // Caso: Fumando solo
        caption = `\`${nameSender}\` *está fumando* 🚬.`;
    } else {
        // Caso: Fumando con alguien
        caption = `\`${nameSender}\` *está fumando con* \`${nameTarget}\` 🚬.`;
    }
    
    // 4. Elegir un GIF aleatorio de la lista de arriba
    const randomGif = smokeGifs[Math.floor(Math.random() * smokeGifs.length)];

    // 5. Enviar mensaje
    await m.react('🚬');
    await conn.sendMessage(m.chat, { 
        video: { url: randomGif }, 
        gifPlayback: true, 
        caption: caption, 
        mentions: [who, m.sender] 
    }, { quoted: m });
};

handler.help = ['smoke', 'fumar'];
handler.tags = ['anime'];
handler.command = ['smoke', 'fumar'];
handler.group = true;

export default handler;