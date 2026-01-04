import fetch from 'node-fetch'

// Función decorativa (Aesthetic)
const styleText = (text) => {
    const map = {
        'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return text.split('').map(char => map[char] || char).join('');
}

let handler = m => m

handler.before = async function (m, { conn, groupMetadata }) {
    // Si no es un mensaje de sistema (Stub) o no es grupo, ignoramos
    if (!m.messageStubType || !m.isGroup) return
    
    // --- DEBUG: Muestra en la consola qué tipo de cambio detectó ---
    console.log(`[DETECT] StubType: ${m.messageStubType} en el grupo ${m.chat}`)
    // -------------------------------------------------------------

    let usuario = m.sender.split('@')[0]
    let fkontak = null;

    // Intentamos cargar la imagen, si falla no detiene el código
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
        console.log("Error cargando imagen decorativa, usando fallback simple.")
    }

    let text = ''
    let mentions = [m.sender]
    // Aseguramos que existan parámetros para evitar errores
    let param = m.messageStubParameters ? m.messageStubParameters[0] : ''

    // Decoración
    const header = `＿＿＿＿＿＿＿＿⵿\n༕ 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐂𝐈𝐎𝐍 𝐆𝐑𝐔𝐏𝐀𝐋\n｜＼                     ／｜`
    const separator = `╭──┈ ׅ ׁ ᮫ ּ ┈──`
    const end = `╰──┈ ׅ ׁ ᮫ ּ ┈──`

    // 21: Cambio de Nombre
    if (m.messageStubType === 21) {
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐂𝐀𝐌𝐁𝐈𝐎 𝐃𝐄 𝐍𝐎𝐌𝐁𝐑𝐄
 
> 🏷️ ${styleText("Nuevo Titulo:")}
> ${param}

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 22: Cambio de Icono/Foto
    } else if (m.messageStubType === 22) {
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐅𝐎𝐓𝐎 𝐀𝐂𝐓𝐔𝐀𝐋𝐈𝐙𝐀𝐃𝐀
 
> 🖼️ ${styleText("Estado:")}
> ¡El grupo tiene una nueva imagen!

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 23: Enlace Revocado
    } else if (m.messageStubType === 23) {
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐄𝐍𝐋𝐀𝐂𝐄 𝐑𝐄𝐕𝐎𝐂𝐀𝐃𝐎
 
> 🔗 ${styleText("Atencion:")}
> El link de invitación anterior murió.

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 25: Restricción de Edición (Quién edita info)
    } else if (m.messageStubType === 25) {
        let type = param == 'on' ? '🔒 Solo Admins' : '🔓 Todos los miembros'
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐀𝐉𝐔𝐒𝐓𝐄𝐒 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎
 
> ⚙️ ${styleText("Editar Info:")}
> Ahora configurado para: ${type}

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 26: Cerrar/Abrir Chat
    } else if (m.messageStubType === 26) {
        let type = param == 'on' ? '🔒 Cerrado (Solo Admins)' : '🔓 Abierto (Todos)'
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐄𝐒𝐓𝐀𝐃𝐎 𝐃𝐄𝐋 𝐂𝐇𝐀𝐓
 
> 💬 ${styleText("Mensajes:")}
> El chat ahora está: ${type}

> 👤 ${styleText("Hecho por:")}
> @${usuario}
${end}`

    // 27: Nuevo Participante (Add)
    } else if (m.messageStubType === 27) {
        mentions.push(param)
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐍𝐔𝐄𝐕𝐎 𝐌𝐈𝐄𝐌𝐁𝐑𝐎
 
> 👋 ${styleText("Bienvenido/a:")}
> @${param.split('@')[0]}

> 🌸 ${styleText("Disfruta tu estancia")}
${end}`

    // 28: Expulsado/Salio (Kick/Leave) - A veces útil
    } else if (m.messageStubType === 28) {
        mentions.push(param)
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐀𝐃𝐈𝐎𝐒 𝐔𝐒𝐔𝐀𝐑𝐈𝐎
 
> 🥀 ${styleText("Se fue:")}
> @${param.split('@')[0]}

> 👤 ${styleText("Sacado por:")}
> @${usuario}
${end}`

    // 29: Promote (Nuevo Admin)
    } else if (m.messageStubType === 29) {
        mentions.push(param)
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐍𝐔𝐄𝐕𝐎 𝐀𝐃𝐌𝐈𝐍
 
> 👑 ${styleText("Usuario Promovido:")}
> @${param.split('@')[0]}

> 👤 ${styleText("Promovido por:")}
> @${usuario}
${end}`

    // 30: Demote (Quitar Admin)
    } else if (m.messageStubType === 30) {
        mentions.push(param)
        text = `
${header}
${separator}
╳⃟꫶໋ᯓְ֟፝݃ 𝐃𝐄𝐆𝐑𝐀𝐃𝐀𝐃𝐎
 
> 📉 ${styleText("Ya no es Admin:")}
> @${param.split('@')[0]}

> 👤 ${styleText("Degradado por:")}
> @${usuario}
${end}`
    }

    // Enviar mensaje
    if (text) {
        await conn.sendMessage(m.chat, { 
            text: text,
            mentions: mentions,
            contextInfo: {
                externalAdReply: {
                    title: "𝐍𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐜𝐢𝐨𝐧𝐞𝐬 𝐝𝐞𝐥 𝐒𝐢𝐬𝐭𝐞𝐦𝐚",
                    body: "Grupo Actualizado",
                    thumbnail: fkontak ? fkontak.message.locationMessage.jpegThumbnail : null,
                    sourceUrl: null,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: fkontak || m })
    }
}

export default handler