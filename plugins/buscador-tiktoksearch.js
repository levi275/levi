import axios from 'axios'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessageContent } = (await import("@whiskeysockets/baileys")).default

let handler = async (message, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(message.chat, `*[ ⚠️ ] Por favor, ingresa el texto de lo que deseas buscar en TikTok.*`, message)

    function toFancy(str) {
        const map = {
            'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ',
            'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴',
            'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x',
            'y': 'ᥡ', 'z': 'z', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F',
            'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
            'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V',
            'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
        }
        return str.split('').map(char => map[char] || char).join('')
    }

    async function createVideoMessage(url) {
        const { videoMessage } = await generateWAMessageContent({ 
            video: { url } 
        }, { upload: conn.waUploadToServer })
        return videoMessage
    }

    async function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }
    }

    try {
        await message.react('🕒')
        

        let { data: response } = await axios.get('https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=' + text)
        let searchResults = response.data

        if (!searchResults || searchResults.length === 0) return conn.reply(message.chat, 'No se encontraron resultados.', message)

        shuffleArray(searchResults)
        let selectedResults = searchResults.splice(0, 7)
        let results = []

        for (let result of selectedResults) {
            results.push({
                body: proto.Message.InteractiveMessage.Body.fromObject({ 
                    text: toFancy(result.title) // Aplicamos la fuente al título del video
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({ 
                    text: toFancy("Tiktok Search Result") 
                }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: '',
                    hasMediaAttachment: true,
                    videoMessage: await createVideoMessage(result.nowm)
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "vᥱr ᥱᥒ tіkt᥆k ⧉",
                                url: "https://www.tiktok.com", // Si la API devuelve el link original, ponlo aquí: result.url
                                merchant_url: "https://www.tiktok.com"
                            })
                        }
                    ]
                })
            })
        }

        const responseMessage = generateWAMessageFromContent(message.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        externalAdReply: {
                            title: toFancy("Tiktok Search Bot"),
                            body: toFancy("Resultados encontrados"),
                            thumbnailUrl: 'https://i.imgur.com/EfFh7X0.png',
                            sourceUrl: 'https://github.com/WhiskeySockets/Baileys',
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({ 
                            text: `\n★ ${toFancy("Rᥱsᥙᥣtᥲd᥆s dᥱ:")} ${text}\n` 
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ 
                            text: toFancy("⪛✰ Tiktok - Busquedas ✰⪜") 
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({ 
                            hasMediaAttachment: false 
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ 
                            cards: [...results] 
                        })
                    })
                }
            }
        }, { quoted: message })

        await message.react('✅')
        await conn.relayMessage(message.chat, responseMessage.message, { messageId: responseMessage.key.id })

    } catch (error) {
        console.error(error)
        await message.react('❌')
        await conn.reply(message.chat, error.toString(), message)
    }
}

handler.help = ['tiktoksearch <txt>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true

export default handler,