import fetch from 'node-fetch';

const handler = async (m, { conn, command, text, isAdmin, isBotAdmin }) => {
    // Función auxiliar para obtener el JID real (evita errores de LID)
    const getProperJid = (jid) => {
        if (!jid) return null;
        if (jid.endsWith('@lid')) {
            // Si es un LID, intentamos limpiarlo si es posible, o retornamos tal cual esperando que el handler lo maneje
            // pero preferiblemente usamos el decode del bot si existe
            return conn.decodeJid ? conn.decodeJid(jid) : jid; 
        }
        return jid;
    };

    let who;
    if (m.isGroup) {
        who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text;
    } else {
        who = m.chat;
    }

    // Limpiamos el ID para asegurarnos de que sea @s.whatsapp.net
    if (who) {
        who = getProperJid(who);
        // Si es texto plano (número), lo formateamos
        if (!who.includes('@')) who = who.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    }

    if (!who) return conn.reply(m.chat, '🍬 *Menciona o responde al usuario*', m);

    let user = global.db.data.users[who];
    if (!user) {
        global.db.data.users[who] = { muto: false }; // Crear usuario si no existe
        user = global.db.data.users[who];
    }

    const bot = conn.user.jid || conn.user.id; // JID del bot

    // --- COMANDO MUTE ---
    if (command === 'mute') {
        if (!isAdmin && !m.fromMe) throw '🍬 *Solo un administrador puede ejecutar este comando*';
        if (who === bot) throw '🍭 *No puedes mutar al bot*';
        if (user.muto === true) throw '🍭 *Este usuario ya ha sido mutado*';

        // Lógica visual (Fake Location)
        let fakeLocationMute = {
            key: { participants: '0@s.whatsapp.net', fromMe: false, id: 'Halo' },
            message: {
                locationMessage: {
                    name: '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼',
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/f8324d9798fa2ed2317bc.png')).buffer(),
                    vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Muted;;;\nFN:Muted\nEND:VCARD'
                }
            },
            participant: '0@s.whatsapp.net'
        };

        global.db.data.users[who].muto = true;
        conn.reply(m.chat, '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼', fakeLocationMute, null, { mentions: [who] });
    
    // --- COMANDO UNMUTE ---
    } else if (command === 'unmute') {
        if (!isAdmin && !m.fromMe) throw '🍬 *Solo un administrador puede ejecutar este comando*';
        if (user.muto === false) throw '🍭 *Este usuario no está mutado*';

        let fakeLocationUnmute = {
            key: { participants: '0@s.whatsapp.net', fromMe: false, id: 'Halo' },
            message: {
                locationMessage: {
                    name: '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗱𝗲𝗺𝘂𝘁𝗮𝗱𝗼',
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/aea704d0b242b8c41bf15.png')).buffer(),
                    vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Free;;;\nFN:Free\nEND:VCARD'
                }
            },
            participant: '0@s.whatsapp.net'
        };

        global.db.data.users[who].muto = false;
        conn.reply(m.chat, '🍬 *El usuario ya puede hablar*', fakeLocationUnmute, null, { mentions: [who] });
    }
};

handler.command = ['mute', 'unmute'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;