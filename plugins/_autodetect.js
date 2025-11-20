import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

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
    let pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => 'https://i.imgur.com/iP6Jg9I.jpeg')
    let img = await (await fetch(pp)).buffer()

    const decorations = {
        line: '‿︵‿︵‿︵୨˚̣̣̣͙୧ - - ୨˚̣̣̣͙୧‿︵‿︵‿︵',
        header: ' . ⁺ ︵֔⏜۠͡︵ 🧸 ︵۠͡⏜֔︵ ⁺ .',
        star: '✦',
        heart: '𖹭',
        bear: '🐻‍❄️',
        flower: '❀'
    }

    const fakeChannel = {
        contextInfo: {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardingScore: 999,
            externalAdReply: {
                title: styleText(groupMetadata.subject),
                body: "꯭✎ ꯭𝘚꯭𝘦꯭𝘦 ꯭𝘪𝘯꯭𝘧𝘰 ꯭𝘰𝘧 ꯭𝘵𝘩꯭𝘪𝘴 ꯭𝘨𝘳꯭𝘰𝘶꯭𝘱 ꯭𝘩𝘦꯭𝘳𝘦 ꯭🔭",
                mediaType: 1,
                renderLargerThumbnail: true,
                previewType: "PHOTO",
                thumbnail: img,
                sourceUrl: "https://whatsapp.com/channel/0029Va4QjTC7TkjD6Z92K62s"
            }
        }
    }

    let text = ''
    let mentions = [m.sender]
    let titleAd = ''

    if (chat.detect && m.messageStubType == 21) {
        titleAd = '𝐍𝐄𝐖 𝐍𝐀𝐌𝐄'
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐡𝐚𝐧𝐠𝐞𝐝 𝐓𝐡𝐞 𝐍𝐚𝐦𝐞.   𖤝      
꒰꒰ 🐻‍❄️ 𝐍𝐞𝐰 𝐍𝐚𝐦𝐞 Ი꯭ᰍ
> 🏷️ ${styleText(m.messageStubParameters[0])}
${decorations.line}`

    } else if (chat.detect && m.messageStubType == 22) {
        titleAd = '𝐍𝐄𝐖 𝐈𝐂𝐎𝐍'
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐔𝐩𝐝𝐚𝐭𝐞𝐝 𝐭𝐡𝐞 𝐈𝐜𝐨𝐧.   𖤝      
꒰꒰ 🖼️ 𝐒𝐭𝐚𝐭𝐮𝐬 Ი꯭ᰍ
> 🫧 ${styleText("Aesthetic Mode On")}
${decorations.line}`

    } else if (chat.detect && m.messageStubType == 23) {
        titleAd = '𝐋𝐈𝐍𝐊 𝐑𝐄𝐒𝐄𝐓'
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐑𝐞𝐯𝐨𝐤𝐞𝐝 𝐭𝐡𝐞 𝐋𝐢𝐧𝐤.   𖤝      
꒰꒰ 🔗 𝐒𝐭𝐚𝐭𝐮𝐬 Ი꯭ᰍ
> 🚫 ${styleText("Old link is dead")}
${decorations.line}`

    } else if (chat.detect && m.messageStubType == 25) {
        titleAd = '𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒'
        let type = m.messageStubParameters[0] == 'on' ? '𝐀𝐝𝐦𝐢𝐧𝐬 𝐎𝐧𝐥𝐲' : '𝐀𝐥𝐥 𝐔𝐬𝐞𝐫𝐬'
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐄𝐝𝐢𝐭 𝐈𝐧𝐟𝐨 𝐆𝐫𝐨𝐮𝐩.   𖤝      
꒰꒰ ⚙️ 𝐍𝐨𝐰 Ი꯭ᰍ
> 🔓 ${styleText(type)}
${decorations.line}`

    } else if (chat.detect && m.messageStubType == 26) {
        titleAd = '𝐆𝐑𝐎𝐔𝐏 𝐒𝐓𝐀𝐓𝐔𝐒'
        let type = m.messageStubParameters[0] == 'on' ? '🔒 𝐂𝐥𝐨𝐬𝐞𝐝' : '🔓 𝐎𝐩𝐞𝐧'
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐔𝐩𝐝𝐚𝐭𝐞𝐝 𝐂𝐡𝐚𝐭.   𖤝      
꒰꒰ 💬 𝐌𝐨𝐝𝐞 Ი꯭ᰍ
> ${styleText(type)}
${decorations.line}`

    } else if (chat.detect2 && m.messageStubType == 27) {
        titleAd = '𝐖𝐄𝐋𝐂𝐎𝐌𝐄'
        let nuevo = m.messageStubParameters[0]
        mentions.push(nuevo)
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐀𝐜𝐜𝐞𝐩𝐭𝐞𝐝 𝐍𝐞𝐰 𝐌𝐞𝐦𝐛𝐞𝐫.   𖤝      
꒰꒰ 🧸 𝐍𝐞𝐰 𝐁𝐚𝐛𝐲 Ი꯭ᰍ
> 👋 @${nuevo.split('@')[0]}
${decorations.line}`

    } else if (chat.detect && m.messageStubType == 29) {
        titleAd = '𝐍𝐄𝐖 𝐀𝐃𝐌𝐈𝐍'
        let nuevoAdmin = m.messageStubParameters[0]
        mentions.push(nuevoAdmin)
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐏𝐫𝐨𝐦𝐨𝐭𝐞𝐝 𝐔𝐬𝐞𝐫.   𖤝      
꒰꒰ 👑 𝐍𝐞𝐰 𝐁𝐨𝐬𝐬 Ი꯭ᰍ
> 🫡 @${nuevoAdmin.split('@')[0]}
${decorations.line}`

    } else if (chat.detect && m.messageStubType == 30) {
        titleAd = '𝐃𝐄𝐌𝐎𝐓𝐄𝐃'
        let exAdmin = m.messageStubParameters[0]
        mentions.push(exAdmin)
        text = `
                           .    𝄢
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐃𝐞𝐦𝐨𝐭𝐞𝐝 𝐔𝐬𝐞𝐫.   𖤝      
꒰꒰ 📉 𝐔𝐬𝐞𝐫 Ი꯭ᰍ
> 😔 @${exAdmin.split('@')[0]}
${decorations.line}`
    }

    if (text) {
        fakeChannel.contextInfo.externalAdReply.title = titleAd
        await conn.sendMessage(m.chat, { 
            text: text, 
            contextInfo: {
                ...fakeChannel.contextInfo, 
                mentionedJid: mentions 
            }
        }, { quoted: null })
    }
}

export default handler