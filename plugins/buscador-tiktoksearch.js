import axios from 'axios'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessageContent } = (await import("@whiskeysockets/baileys")).default

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, '🍟 *Por favor, ingresa un texto para buscar en TikTok*', m)

    // Función para texto "Fancy"
    const toFancy = str => {
        const map = { 'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ', 'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴', 'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x', 'y': 'ᥡ', 'z': 'z', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z' };
        return str.split('').map(c => map[c] || c).join('')
    }

    // --- CAMBIO 1: Función para descargar el video a Buffer ---
    // Esto asegura que cada video tenga su propia identidad única
    const getBuffer = async (url) => {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error descargando buffer:", error);
            return null;
        }
    }

    // Función para crear el mensaje de video DESDE BUFFER
    async function createVideoMessage(buffer) {
        const { videoMessage } = await generateWAMessageContent({
            video: buffer // Pasamos el archivo real, no la URL
        }, {
            upload: conn.waUploadToServer
        });
        return videoMessage;
    }

    // Función para mezclar resultados
    async function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    try {
        await m.react('🕒')

        let searchResults = []
        try {
            // Opción 1: TikWM Search
            let { data: response } = await axios.post('https://www.tikwm.com/api/feed/search', 
                new URLSearchParams({
                    keywords: text,
                    count: 10, // Pedimos un poco menos para no saturar la descarga
                    cursor: 0,
                    web: 1,
                    hd: 1
                }), {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36"
                    }
                }
            )

            if (response.data && response.data.videos) {
                searchResults = response.data.videos.map(v => {
                    let videoUrl = v.play
                    if (!videoUrl.startsWith('http')) {
                        videoUrl = `https://www.tikwm.com${v.play}`
                    }
                    return {
                        title: v.title,
                        nowm: videoUrl, 
                        origin_url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
                    }
                })
            }
        } catch (e) {
            console.log("Error en TikWM:", e)
            try {
                // Opción 2: Agatz
                let { data: response } = await axios.get('https://api.agatz.xyz/api/tiktoksearch?message=' + text)
                searchResults = response.data
            } catch (e2) {
                console.log("Error en Agatz:", e2)
            }
        }

        if (!searchResults || !searchResults.length) return conn.reply(m.chat, 'No se encontraron resultados', m)

        shuffleArray(searchResults)
        // Reducimos a 6 para evitar timeouts largos por la descarga de buffers
        let selectedResults = searchResults.splice(0, 6)
        let results = []

        // Iteramos sobre los resultados
        for (let result of selectedResults) {
            try {
                // --- CAMBIO 2: Descargamos el video antes de crear la tarjeta ---
                // Si la descarga falla, saltamos este video en lugar de romper el código
                let videoBuffer = await getBuffer(result.nowm || result.url);
                
                if (!videoBuffer) continue; // Si no hay buffer, saltamos al siguiente

                results.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: toFancy(result.title || "Tiktok Video")
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: toFancy('Tiktok Search')
                    }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: '',
                        hasMediaAttachment: true,
                        videoMessage: await createVideoMessage(videoBuffer) // Usamos el Buffer
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [{
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: toFancy("vᥱr ᥱᥒ tіkt᥆k ⧉"),
                                url: result.origin_url || "https://www.tiktok.com",
                                merchant_url: result.origin_url || "https://www.tiktok.com"
                            })
                        }]
                    })
                })
            } catch (err) {
                console.log("Error procesando video individual:", err)
                continue;
            }
        }

        if (results.length === 0) return conn.reply(m.chat, 'Error: No se pudieron descargar los videos. Intenta de nuevo.', m)

        const responseMessage = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        externalAdReply: {
                            title: toFancy('Tiktok Search Bot'),
                            body: toFancy('Resultados encontrados'),
                            thumbnailUrl: 'https://i.imgur.com/EfFh7X0.png',
                            sourceUrl: 'https://github.com/WhiskeySockets/Baileys',
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `\n ${toFancy("ᰔᩚ ᥱs𝗍᥆s s᥆ᥒ ᥣ᥆s rᥱsᥙᥣ𝗍ᥲძ᥆s ძᥱ:")} ${text}\n`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: toFancy("𝙏𝙄𝙆𝙏𝙊𝙆 - 𝙎𝙀𝘼𝙍𝘾𝙃")
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
        }, {
            quoted: m
        })

        await m.react('✅')
        await conn.relayMessage(m.chat, responseMessage.message, {
            messageId: responseMessage.key.id
        })

    } catch (error) {
        await m.react('❌')
        console.error(error)
        await conn.reply(m.chat, error.toString(), m)
    }
}

handler.help = ['tiktoksearch <txt>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true
handler.coin = 2

export default handler