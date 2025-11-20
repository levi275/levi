/**
 * MODIFICADO Y DECORADO - DETECTOR DE EVENTOS
 * Estilo: Aesthetic / Premium
 * Funciones: ExternalAdReply para mejor visualización
 */

import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

// Función para estilizar texto (Bold Italic Sans)
const styleText = (text) => {
    const map = {
        'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
        'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return text.split('').map(char => map[char] || char).join('');
}

let handler = m => m

handler.before = async function (m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return

    let chat = global.db.data.chats[m.chat]
    let usuario = m.sender.split('@')[0]
    let pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => 'https://i.imgur.com/iP6Jg9I.jpeg') // Imagen por defecto si falla
    
    // Configuración del mensaje "Fake" (Fkontak mejorado con adReply)
    // Esto crea una tarjeta visual bonita arriba del mensaje
    const fakeChannel = {
        contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: {
                title: styleText("NOTIFICACION DEL GRUPO"),
                body: styleText(groupMetadata.subject),
                mediaType: 1,
                renderLargerThumbnail: true,
                previewType: "PHOTO",
                thumbnailUrl: pp,
                sourceUrl: "https://whatsapp.com/channel/0029Va4QjTC7TkjD6Z92K62s" // Puedes poner tu canal aquí
            }
        }
    }

    // Textos y lógica
    let text = ''
    let mentions = [m.sender]
    let actionType = ''

    // 1. Cambio de Nombre del Grupo (Type 21)
    if (chat.detect && m.messageStubType == 21) {
        actionType = '📝 𝐂𝐀𝐌𝐁𝐈𝐎 𝐃𝐄 𝐍𝐎𝐌𝐁𝐑𝐄'
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("El nombre del grupo ha sido actualizado.")}
┆
┆ 👤 *Autor:* @${usuario}
┆ 🏷️ *Nuevo Nombre:*
┆ ${styleText(m.messageStubParameters[0])}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`
    
    // 2. Cambio de Foto del Grupo (Type 22)
    } else if (chat.detect && m.messageStubType == 22) {
        actionType = '🖼️ 𝐍𝐔𝐄𝐕𝐀 𝐈𝐌𝐀𝐆𝐄𝐍'
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("La identidad visual del grupo ha cambiado.")}
┆
┆ 👤 *Autor:* @${usuario}
┆ 📸 *Estado:* ${styleText("Icono Actualizado")}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`

    // 3. Restablecer Enlace (Type 23) (Detecta cuando se revoca el link)
    } else if (chat.detect && m.messageStubType == 23) {
        actionType = '🔗 𝐄𝐍𝐋𝐀𝐂𝐄 𝐑𝐄𝐕𝐎𝐂𝐀𝐃𝐎'
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("El enlace de invitación anterior ya no sirve.")}
┆
┆ 👤 *Autor:* @${usuario}
┆ 🛡️ *Acción:* ${styleText("Link Restablecido")}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`

    // 4. Configuración de Grupo (Type 25 - Editar info)
    } else if (chat.detect && m.messageStubType == 25) {
        actionType = '⚙️ 𝐀𝐉𝐔𝐒𝐓𝐄𝐒 𝐃𝐄 𝐄𝐃𝐈𝐂𝐈𝐎𝐍'
        let allow = m.messageStubParameters[0] == 'on' ? 'Solo Admins' : 'Todos los participantes'
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("Se han modificado los permisos de edición.")}
┆
┆ 👤 *Autor:* @${usuario}
┆ 🔓 *Permitido a:* ${styleText(allow)}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`

    // 5. Grupo Cerrado/Abierto (Type 26)
    } else if (chat.detect && m.messageStubType == 26) {
        actionType = m.messageStubParameters[0] == 'on' ? '🔒 𝐆𝐑𝐔𝐏𝐎 𝐂𝐄𝐑𝐑𝐀𝐃𝐎' : '🔓 𝐆𝐑𝐔𝐏𝐎 𝐀𝐁𝐈𝐄𝐑𝐓𝐎'
        let status = m.messageStubParameters[0] == 'on' ? 'Solo Admins' : 'Todos'
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("Se han actualizado los permisos de mensajería.")}
┆
┆ 👤 *Autor:* @${usuario}
┆ 💬 *Pueden enviar:* ${styleText(status)}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`

    // 6. Nuevo Participante / Autoaceptado (Type 27)
    } else if (chat.detect2 && m.messageStubType == 27) {
        actionType = '👋 𝐍𝐔𝐄𝐕𝐎 𝐌𝐈𝐄𝐌𝐁𝐑𝐎'
        let nuevoUser = m.messageStubParameters[0].split('@')[0]
        mentions.push(m.messageStubParameters[0])
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("¡Demos la bienvenida a un nuevo integrante!")}
┆
┆ 👤 *Nuevo:* @${nuevoUser}
┆ 👮‍♂️ *Aceptado por:* @${usuario}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`

    // 7. Nuevo Admin (Type 29)
    } else if (chat.detect && m.messageStubType == 29) {
        actionType = '🛡️ 𝐍𝐔𝐄𝐕𝐎 𝐀𝐃𝐌𝐈𝐍'
        let nuevoAdmin = m.messageStubParameters[0].split('@')[0]
        mentions.push(m.messageStubParameters[0])
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("El grupo tiene un nuevo administrador.")}
┆
┆ 🏅 *Ascendido:* @${nuevoAdmin}
┆ 👤 *Por:* @${usuario}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`

    // 8. Admin Eliminado (Type 30)
    } else if (chat.detect && m.messageStubType == 30) {
        actionType = '📉 𝐃𝐄𝐆𝐑𝐀𝐃𝐀𝐃𝐎'
        let exAdmin = m.messageStubParameters[0].split('@')[0]
        mentions.push(m.messageStubParameters[0])
        text = `
╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
┆ ${styleText("Un participante ha perdido sus privilegios.")}
┆
┆ 🔻 *Usuario:* @${exAdmin}
┆ 👤 *Por:* @${usuario}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`
    }

    // ENVIAR MENSAJE SI HAY TEXTO DEFINIDO
    if (text) {
        // Actualizamos el título del fakeChannel dependiendo de la acción
        fakeChannel.contextInfo.externalAdReply.title = actionType
        
        await conn.sendMessage(m.chat, { 
            text: text, 
            contextInfo: {
                ...fakeChannel.contextInfo, 
                mentionedJid: mentions 
            }
        }, { quoted: null }) // Quoted null para que se vea más limpio o puedes poner 'm'
    } else {
        // Log para debug si es un tipo desconocido
        if (m.messageStubType != 2) {
            console.log({
                type: m.messageStubType,
                params: m.messageStubParameters
            })
        }
    }
}

export default handler