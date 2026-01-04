import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

// Función para texto "Fancy" (Negrita Serif - Estilo Aesthetic)
const styleText = (text) => {
    const map = {
        'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return text.split('').map(char => map[char] || char).join('');
}

// Función para texto "Monospace" (Para detalles técnicos)
const monoText = (text) => {
    return '```' + text + '```';
}

let handler = m => m

handler.before = async function (m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return
    
    let chat = global.db.data.chats[m.chat] || {}
    // Solo se ejecuta si la detección está activada en el chat (opcional, depende de tu base de datos)
    // Si quieres que funcione siempre, quita la condición "&& chat.detect" de los ifs abajo.

    let usuario = m.sender.split('@')[0]
    let fkontak = null;

    // Descargamos la imagen para la miniatura
    try {
        const res = await fetch('https://i.postimg.cc/6562JdR7/Hoshino-Ruby-(2).jpg');
        const thumb2 = await res.buffer();
        fkontak = {
            key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
            message: {
                locationMessage: {
                    name: styleText('Notificaciones del Grupo'),
                    jpegThumbnail: thumb2
                }
            },
            participant: '0@s.whatsapp.net'
        };
    } catch (e) {
        console.error(e)
    }

    let text = ''
    let mentions = [m.sender]

    // Estructura Decorativa Base
    const header = `＿＿＿＿＿＿＿＿⵿\n༕ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐂𝐈𝐎𝐍 𝐆𝐑𝐔𝐏𝐀𝐋\n｜＼                     ／｜`
    const separator = `╭──┈ ׅ ׁ ᮫ ּ ┈──`
    const end = `╰──┈ ׅ ׁ ᮫ ּ ┈──`

    // --- LÓGICA DE DETECCIÓN ---

    // 21: Cambio de Nombre del Grupo
    if (chat.detect && m.messageStubType == 21) {
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐂𝐀𝐌𝐁𝐈𝐎 𝐃𝐄 𝐍𝐎𝐌𝐁𝐑𝐄
 
> 🏷️ ${styleText("Nuevo Titulo:")}
> ${m.messageStubParameters[0]}

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 22: Cambio de Imagen del Grupo
    } else if (chat.detect && m.messageStubType == 22) {
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐅𝐎𝐓𝐎 𝐀𝐂𝐓𝐔𝐀𝐋𝐈𝐙𝐀𝐃𝐀
 
> 🖼️ ${styleText("Estado:")}
> ¡El grupo tiene una nueva imagen de perfil!

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 23: Enlace de Invitación Revocado
    } else if (chat.detect && m.messageStubType == 23) {
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐄𝐍𝐋𝐀𝐂𝐄 𝐑𝐄𝐕𝐎𝐂𝐀𝐃𝐎
 
> 🔗 ${styleText("Atencion:")}
> El enlace de invitación anterior ya no funciona.

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 25: Editar Info del Grupo (Quién puede editar nombre/descripción)
    } else if (chat.detect && m.messageStubType == 25) {
        let type = m.messageStubParameters[0] == 'on' ? '🔒 Solo Admins' : '🔓 Todos los miembros'
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐀𝐉𝐔𝐒𝐓𝐄𝐒 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎
 
> ⚙️ ${styleText("Editar Info:")}
> Ahora configurado para: ${type}

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 26: Estado del Chat (Cerrar/Abrir chat para enviar mensajes)
    } else if (chat.detect && m.messageStubType == 26) {
        let type = m.messageStubParameters[0] == 'on' ? '🔒 Cerrado (Solo Admins)' : '🔓 Abierto (Todos)'
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐄𝐒𝐓𝐀𝐃𝐎 𝐃𝐄𝐋 𝐂𝐇𝐀𝐓
 
> 💬 ${styleText("Mensajes:")}
> El chat ahora está: ${type}

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 27: Nuevo Miembro (Bienvenida simple por detección)
    } else if (chat.detect2 && m.messageStubType == 27) {
        let nuevo = m.messageStubParameters[0]
        mentions.push(nuevo)
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐍𝐔𝐄𝐕𝐎 𝐌𝐈𝐄𝐌𝐁𝐑𝐎
 
> 👋 ${styleText("Bienvenido/a:")}
> @${nuevo.split('@')[0]}

> 🌸 ${styleText("Disfruta tu estancia")}
${end}`

    // 29: Nuevo Admin (Promote)
    } else if (chat.detect && m.messageStubType == 29) {
        let nuevoAdmin = m.messageStubParameters[0]
        mentions.push(nuevoAdmin)
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐍𝐔𝐄𝐕𝐎 𝐀𝐃𝐌𝐈𝐍
 
> 👑 ${styleText("Usuario Promovido:")}
> @${nuevoAdmin.split('@')[0]}

> 👤 ${styleText("Promovido por:")}
> @${usuario}
${end}`

    // 30: Quitar Admin (Demote)
    } else if (chat.detect && m.messageStubType == 30) {
        let exAdmin = m.messageStubParameters[0]
        mentions.push(exAdmin)
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐃𝐄𝐆𝐑𝐀𝐃𝐀𝐃𝐎
 
> 📉 ${styleText("Ya no es Admin:")}
> @${exAdmin.split('@')[0]}

> 👤 ${styleText("Degradado por:")}
> @${usuario}
${end}`
    }

    // Enviar el mensaje si hubo algún cambio detectado
    if (text) {
        await conn.sendMessage(m.chat, { 
            text: text, 
            mentions: mentions,
            contextInfo: {
                externalAdReply: {
                    title: "𝐍𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐜𝐢𝐨𝐧𝐞𝐬 𝐝𝐞𝐥 𝐒𝐢𝐬𝐭𝐞𝐦𝐚",
                    body: "Grupo Actualizado",
                    thumbnail: thumb2 ? await res.buffer() : null, // Reutilizamos el buffer si existe
                    sourceUrl: null,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: fkontak || m })
    }
}

export default handler