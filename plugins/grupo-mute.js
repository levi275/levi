import fetch from 'node-fetch'

let handler = async (m, { conn, command, text, args, participants, usedPrefix }) => {
    
    // 1. Identificar al usuario objetivo (Mención, Reply o Texto)
    let who
    if (m.isGroup) {
        who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
    } else {
        who = m.chat
    }

    // Mensaje de ayuda si no etiqueta a nadie
    if (!who) return conn.reply(m.chat, `☁️ *Etiqueta o responde al mensaje de la persona que deseas ${command === 'mute' ? 'silenciar' : 'liberar'}.*\n\n*Ejemplo:* ${usedPrefix + command} @usuario`, m)

    let user = global.db.data.users[who]
    if (!user) {
        // Aseguramos que el usuario exista en la DB
        global.db.data.users[who] = { muto: false }
        user = global.db.data.users[who]
    }

    // 2. Definir los Mensajes Fake (Lo que pediste)
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
    }

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
    }

    // 3. Validaciones de Seguridad (Como en tu comando kick)
    const botJid = conn.user.jid.split`@`[0] + '@s.whatsapp.net'
    const ownerGroup = m.chat.split`-`[0] + '@s.whatsapp.net'
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'

    if (who === botJid) return conn.reply(m.chat, '🛡️ *No puedo silenciarme a mí mismo.*', m)
    if (who === ownerBot || global.owner.map(v => v[0] + '@s.whatsapp.net').includes(who)) return conn.reply(m.chat, '👑 *No puedo silenciar a mi creador.*', m)

    // 4. Lógica del comando UNMUTE
    if (command === 'unmute' || command === 'desmutear') {
        if (!user.muto) return conn.reply(m.chat, `❕ *El usuario @${who.split`@`[0]} no estaba silenciado.*`, m, { mentions: [who] })
        
        user.muto = false
        return conn.sendMessage(m.chat, { text: `🔊 *¡LIBERTAD!*\n\nEl usuario @${who.split`@`[0]} ya puede hablar de nuevo.`, mentions: [who] }, { quoted: fakeLocationUnmute })
    }

    // 5. Lógica del comando MUTE
    if (command === 'mute' || command === 'silenciar') {
        if (user.muto) return conn.reply(m.chat, `🤫 *El usuario @${who.split`@`[0]} ya está silenciado.*`, m, { mentions: [who] })

        // --- Lógica Temporal (Timer) ---
        // Buscamos si hay un argumento de tiempo (ej: 10s, 1m, 1h)
        let timer = null
        // Si el usuario pone: .mute @tag 10m
        // args[0] suele ser el tag, args[1] el tiempo. Pero a veces el tag es args[1].
        // Buscamos en todos los argumentos algo que parezca tiempo.
        let timeArg = args.find(arg => arg.match(/^[0-9]+(s|m|h|d)$/))
        
        let ms = 0
        if (timeArg) {
            let unit = timeArg.slice(-1)
            let value = parseInt(timeArg.slice(0, -1))
            switch(unit) {
                case 's': ms = value * 1000; break;
                case 'm': ms = value * 60000; break;
                case 'h': ms = value * 3600000; break;
                case 'd': ms = value * 86400000; break;
            }
        }

        user.muto = true

        if (ms > 0) {
            // Mute Temporal
            conn.sendMessage(m.chat, { 
                text: `🔇 *SILENCIADO TEMPORALMENTE*\n\n👤 *Usuario:* @${who.split`@`[0]}\n⏱️ *Tiempo:* ${timeArg}\n\n_Sus mensajes serán eliminados automáticamente durante este tiempo._`, 
                mentions: [who] 
            }, { quoted: fakeLocationMute })

            // Temporizador para desmutear
            setTimeout(() => {
                if (user.muto) { // Verificar si sigue mutado antes de quitarlo
                    user.muto = false
                    conn.sendMessage(m.chat, { text: `⏰ *El silencio temporal de @${who.split`@`[0]} ha terminado.*`, mentions: [who] })
                }
            }, ms)

        } else {
            // Mute Indefinido
            conn.sendMessage(m.chat, { 
                text: `🔇 *SILENCIADO INDEFINIDAMENTE*\n\n👤 *Usuario:* @${who.split`@`[0]}\n\n_Shhh... silencio. Sus mensajes serán eliminados hasta que un admin decida lo contrario._`, 
                mentions: [who] 
            }, { quoted: fakeLocationMute })
        }
    }
}

handler.help = ['mute', 'unmute']
handler.tags = ['group']
handler.command = /^(mute|silenciar|unmute|desmutear)$/i
handler.group = true
handler.admin = true      // Solo admins pueden usarlo
handler.botAdmin = true   // El bot debe ser admin para borrar mensajes

export default handler