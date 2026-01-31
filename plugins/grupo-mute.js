import fetch from 'node-fetch';

const handler = async (m, { conn, command, text, isAdmin }) => {
    
    // Lógica para determinar a quién se aplica el comando (mención, respuesta o texto)
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : 
              m.quoted ? m.quoted.sender : 
              text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

    // --- COMANDO MUTE ---
    if (command === 'mute') {
        if (!isAdmin) throw '🍬 *Solo un administrador puede ejecutar este comando*';
        
        // Verificar si el dueño del bot está definido correctamente
        const ownerBot = global.owner[0][0] + '@s.whatsapp.net';
        
        if (m.mentionedJid[0] === ownerBot) throw '🍬 *El creador del bot no puede ser mutado*';
        if (who === conn.user.jid) throw '🍭 *No puedes mutar el bot*';
        
        // Obtener metadatos del grupo para proteger al creador del grupo
        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupOwner = groupMetadata.owner || m.chat.split`-`[0] + '@s.whatsapp.net';
        
        if (m.mentionedJid[0] === groupOwner) throw '🍭 *No puedes mutar el creador del grupo*';
        
        // Si no se mencionó a nadie
        if (!who) return conn.reply(m.chat, '🍬 *Menciona a la persona que deseas mutar*', m);

        // Verificar base de datos
        let user = global.db.data.users[who];
        if (user.muto === true) throw '🍭 *Este usuario ya ha sido mutado*';

        // Crear mensaje falso de ubicación (para estética)
        let fakeLocationMute = {
            'key': {
                'participants': '0@s.whatsapp.net',
                'fromMe': false,
                'id': 'Halo'
            },
            'message': {
                'locationMessage': {
                    'name': '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼',
                    'jpegThumbnail': await (await fetch('https://telegra.ph/file/f8324d9798fa2ed2317bc.png')).buffer(),
                    'vcard': 'BEGIN:VCARD\nVERSION:3.0\nN:;Unlimited;;;\nFN:Unlimited\nORG:Unlimited\nTITLE:\nitem1.TEL;waid=19709001746:+1 (970) 900-1746\nitem1.X-ABLabel:Unlimited\nX-WA-BIZ-DESCRIPTION:ofc\nX-WA-BIZ-NAME:Unlimited\nEND:VCARD'
                }
            },
            'participant': '0@s.whatsapp.net'
        };

        // Ejecutar acción
        conn.reply(m.chat, '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼', fakeLocationMute, null, { mentions: [who] });
        global.db.data.users[who].muto = true;
    
    // --- COMANDO UNMUTE ---
    } else if (command === 'unmute') {
        if (!isAdmin) throw '🍬 *Solo un administrador puede ejecutar este comando*'; // Nota: El original usaba un mensaje distinto aquí, he unificado para consistencia o puedes usar el original si prefieres.

        // Si no se mencionó a nadie
        if (!who) return conn.reply(m.chat, '🍬 *Menciona a la persona que deseas demutar*', m);
        
        // Verificar si intentas desmutarte a ti mismo (lógica del original)
        if (who === m.sender) throw '🍬 *Sólo otro administrador puede desmutarte*';

        // Verificar base de datos
        let user = global.db.data.users[who];
        if (user.muto === false) throw '🍭 *Este usuario no ha sido mutado*';

        // Crear mensaje falso de ubicación (para estética)
        let fakeLocationUnmute = {
            'key': {
                'participants': '0@s.whatsapp.net',
                'fromMe': false,
                'id': 'Halo'
            },
            'message': {
                'locationMessage': {
                    'name': '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗱𝗲𝗺𝘂𝘁𝗮𝗱𝗼',
                    'jpegThumbnail': await (await fetch('https://telegra.ph/file/aea704d0b242b8c41bf15.png')).buffer(),
                    'vcard': 'BEGIN:VCARD\nVERSION:3.0\nN:;Unlimited;;;\nFN:Unlimited\nORG:Unlimited\nTITLE:\nitem1.TEL;waid=19709001746:+1 (970) 900-1746\nitem1.X-ABLabel:Unlimited\nX-WA-BIZ-DESCRIPTION:ofc\nX-WA-BIZ-NAME:Unlimited\nEND:VCARD'
                }
            },
            'participant': '0@s.whatsapp.net'
        };

        // Ejecutar acción
        global.db.data.users[who].muto = false;
        conn.reply(m.chat, '*Tus mensajes no serán eliminados*', fakeLocationUnmute, null, { mentions: [who] });
    }
};

handler.command = ['mute', 'unmute'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;