import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

// --- CONFIGURACIÓN DE ESTILO ---
const newsletterJid = '120363335626706839@newsletter'
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥'

// Lista de iconos aesthetic aleatorios para la miniatura
const iconos = [
    'https://qu.ax/wwbar.jpg', 'https://qu.ax/iFzQw.jpeg', 'https://qu.ax/dsZyo.jpeg',
    'https://qu.ax/eNdBB.jpeg', 'https://qu.ax/MSzGw.jpeg', 'https://qu.ax/JqMBW.jpeg',
    'https://qu.ax/HKcSr.jpeg', 'https://qu.ax/HOuUU.jpeg', 'https://qu.ax/ojUNn.jpeg',
    'https://qu.ax/HtqBi.jpeg', 'https://qu.ax/bmQOA.jpeg', 'https://qu.ax/nTFtU.jpeg',
    'https://qu.ax/PYKgC.jpeg', 'https://qu.ax/exeBy.jpeg', 'https://qu.ax/SCxhf.jpeg',
    'https://qu.ax/sqxSO.jpeg', 'https://qu.ax/cdSYJ.jpeg', 'https://qu.ax/dRmZY.jpeg',
    'https://qu.ax/ubwLP.jpg', 'https://qu.ax/JSgSc.jpg', 'https://qu.ax/FUXJo.jpg',
    'https://qu.ax/qhKUf.jpg', 'https://qu.ax/mZKgt.jpg'
]

const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)]

// Función para texto aesthetic
const toFancy = (str) => {
    const map = {
        'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ', 'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴', 'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x', 'y': 'ᥡ', 'z': 'z',
        'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
    }
    return str.split('').map(c => map[c] || c).join('')
}

export async function before(m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return true
    
    const chat = global.db.data.chats[m.chat]
    if (!chat || !chat.welcome) return true

    // Verificar si es el bot principal (para evitar spam si hay sub-bots)
    const primaryBot = chat.botPrimario
    if (primaryBot && conn.user.jid !== primaryBot) return true

    const userId = m.messageStubParameters[0]
    const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg')
    const username = `@${userId.split('@')[0]}`
    const groupName = groupMetadata.subject
    const desc = groupMetadata.desc?.toString() || 'Sin descripción'
    const groupSize = groupMetadata.participants.length
    const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' })

    // --- BIENVENIDA (WELCOME) ---
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        let text
        if (chat.welcomeText) {
            text = chat.welcomeText.replace(/@user/g, username).replace(/@subject/g, groupName).replace(/@desc/g, desc)
        } else {
            text = `
╭─── *·˚ 🪷 ${toFancy("NUEVO USUARIO")} 🪷 ˚·* ───╮

 🌸 ¡${toFancy("Hola")}, ${username}! ૮(ˊ ᵔ ˋ)ა
 🍡 ${toFancy("Bienvenid@ a la familia de")}:
 *${groupName}*

 🎐 ${toFancy("Esperamos que tu estadía")}
 ${toFancy("sea maravillosa")}.

· · • • • ✿ • • • · ·
「 ${toFancy("INFO DEL GRUPO")} 」
👥 ${toFancy("Miembros")}: ${groupSize}
📅 ${toFancy("Fecha")}: ${fecha}
📝 ${toFancy("Descripción")}:
${desc}
· · • • • ✿ • • • · ·

> ${toFancy("Disfruta tu tiempo aquí")} ✨

╰─── *·˚ 🍥 ˚·* ──────────╯`.trim()
        }

        // Enviando Mensaje de Bienvenida
        await conn.sendMessage(m.chat, {
            image: { url: pp },
            caption: text,
            contextInfo: {
                mentionedJid: [userId],
                isForwarded: true,
                forwardingScore: 9999999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: newsletterJid,
                    newsletterName: newsletterName,
                    serverMessageId: -1
                },
                externalAdReply: {
                    title: '  ͟͞ Ｗ Ｅ Ｌ Ｃ Ｏ Ｍ Ｅ ͟͞  ',
                    body: `✧ ˖ ꒰ ${groupName} ꒱ ˖ ✧`,
                    thumbnailUrl: getRandomIcono(),
                    sourceUrl: global.redes || 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y', // Pon tu canal aquí
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: null })
    }

    // --- DESPEDIDA (BYE) ---
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE) {
        let text
        if (chat.byeText) {
            text = chat.byeText.replace(/@user/g, username).replace(/@subject/g, groupName)
        } else {
            text = `
╭─── *·˚ 💔 ${toFancy("UNA DESPEDIDA")} 💔 ˚·* ───╮

 🥀 ${toFancy("Sayonara")}, ${username} (TωT)/~~~
 ☁️ ${toFancy("Ha dejado el grupo")}:
 *${groupName}*

 🍂 ${toFancy("Esperamos que hayas disfrutado")}
 ${toFancy("tu tiempo con nosotros")}.

· · • • • ✿ • • • · ·
「 ${toFancy("ESTADO ACTUAL")} 」
📉 ${toFancy("Miembros")}: ${groupSize}
📅 ${toFancy("Fecha")}: ${fecha}
· · • • • ✿ • • • · ·

> ${toFancy("Te extrañaremos... o no")} 😹

╰─── *·˚ 🥀 ˚·* ──────────╯`.trim()
        }

        // Enviando Mensaje de Despedida
        await conn.sendMessage(m.chat, {
            image: { url: pp },
            caption: text,
            contextInfo: {
                mentionedJid: [userId],
                isForwarded: true,
                forwardingScore: 9999999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: newsletterJid,
                    newsletterName: newsletterName,
                    serverMessageId: -1
                },
                externalAdReply: {
                    title: '  ͟͞ Ａ Ｄ Ｉ Ｏ́ Ｓ ͟͞  ',
                    body: `✧ ˖ ꒰ ${toFancy("Hasta la proxima")} ꒱ ˖ ✧`,
                    thumbnailUrl: getRandomIcono(), // Usamos un icono aleatorio para la tarjeta
                    sourceUrl: global.redes || 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y',
                    mediaType: 1,
                    renderLargerThumbnail: false, 
                }
            }
        }, { quoted: null })
    }
}

export default { before }