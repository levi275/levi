import axios from 'axios'
const { 
    generateWAMessageFromContent, 
    prepareWAMessageMedia, 
    proto 
} = (await import("@whiskeysockets/baileys")).default

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, '🍟 *¿Qué deseas buscar en TikTok? Ingresa un texto.*', m)

    // Función estética (Fancy Text)
    const toFancy = str => {
        const map = { 'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ', 'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴', 'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x', 'y': 'ᥡ', 'z': 'z' };
        return str.split('').map(c => map[c] || c).join('')
    }

    // Función mezclar
    async function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    try {
        await m.react('🕒')

        let searchResults = []
        
        // --- BÚSQUEDA (TikWM) ---
        try {
            let { data: response } = await axios.post('https://www.tikwm.com/api/feed/search', 
                new URLSearchParams({ keywords: text, count: 12, cursor: 0, web: 1, hd: 1 }), {
                    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "Mozilla/5.0" }
                }
            )
            if (response.data?.videos) {
                searchResults = response.data.videos.map(v => ({
                    title: v.title,
                    // Aseguramos enlaces absolutos
                    nowm: v.play.startsWith('http') ? v.play : `https://www.tikwm.com${v.play}`, 
                    cover: v.cover.startsWith('http') ? v.cover : `https://www.tikwm.com${v.cover}`,
                    author: v.author.nickname,
                    url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
                }))
            }
        } catch (e) {
            // Fallback (Agatz)
            try {
                let { data: response } = await axios.get('https://api.agatz.xyz/api/tiktoksearch?message=' + text)
                searchResults = response.data.map(v => ({
                    title: v.title,
                    nowm: v.nowm || v.url,
                    cover: v.cover || 'https://i.imgur.com/95t44C0.png',
                    author: 'TikTok User',
                    url: v.url
                }))
            } catch (e2) { }
        }

        if (!searchResults.length) return conn.reply(m.chat, '❌ No se encontraron videos.', m)

        shuffleArray(searchResults)
        // Seleccionamos hasta 6 resultados
        let selectedResults = searchResults.splice(0, 6) 

        let cards = []
        
        // --- GENERACIÓN DE TARJETAS (USANDO IMÁGENES) ---
        for (let result of selectedResults) {
            
            // Subimos la IMAGEN (Cover) en lugar del video para evitar el bug de reproducción
            let mediaMessage = await prepareWAMessageMedia({ 
                image: { url: result.cover } 
            }, { upload: conn.waUploadToServer })

            cards.push({
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: `*${toFancy("Título:")}* ${result.title.substring(0, 45)}...`
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: `👤 ${toFancy(result.author)}`
                }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: "",
                    hasMediaAttachment: true,
                    ...mediaMessage // Aquí va la imagen preparada
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [
                        {
                            // Botón para ver el video directamente en el navegador (pantalla completa)
                            "name": "cta_url",
                            "buttonParamsJson": JSON.stringify({
                                "display_text": "▶️ Ver Video",
                                "url": result.nowm, 
                                "merchant_url": result.nowm
                            })
                        },
                        {
                            // Botón para ir a la publicación original
                            "name": "cta_url",
                            "buttonParamsJson": JSON.stringify({
                                "display_text": "🔗 Link Original",
                                "url": result.url,
                                "merchant_url": result.url
                            })
                        }
                    ]
                })
            })
        }

        const messageContent = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `${toFancy("✦ Rᥱsᥙᥣ𝗍ᥲძ᥆s ᥱᥒᥴ᥆ᥒ𝗍rᥲძ᥆s:")} ${text}\n_Usa los botones para ver el video_ 👇`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: "TikTok Search 🔎"
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            hasMediaAttachment: false
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: cards
                        })
                    })
                }
            }
        }, { quoted: m })

        await conn.relayMessage(m.chat, messageContent.message, { messageId: messageContent.key.id })
        await m.react('✅')

    } catch (error) {
        await m.react('❌')
        console.error(error)
        conn.reply(m.chat, 'Error al buscar.', m)
    }
}

handler.help = ['tiktoksearch <txt>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true

export default handler