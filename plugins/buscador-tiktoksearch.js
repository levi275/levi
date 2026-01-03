import axios from 'axios'

// Asegúrate de que tu bot soporte la estructura de 'cards' según la librería que usas (@itsukichan/baileys)
let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, '🍟 *¿Qué video de TikTok buscas hoy?*', m)

    // Función "Fancy" para texto bonito
    const toFancy = str => {
        const map = { 'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ', 'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴', 'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x', 'y': 'ᥡ', 'z': 'z', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z' };
        return str.split('').map(c => map[c] || c).join('')
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
        
        // --- BÚSQUEDA (Misma lógica que tenías, funciona bien) ---
        try {
            let { data: response } = await axios.post('https://www.tikwm.com/api/feed/search', 
                new URLSearchParams({ keywords: text, count: 12, cursor: 0, web: 1, hd: 1 }), 
                { headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36" }}
            )

            if (response.data && response.data.videos) {
                searchResults = response.data.videos.map(v => {
                    let videoUrl = v.play
                    if (!videoUrl.startsWith('http')) videoUrl = `https://www.tikwm.com${v.play}`
                    return {
                        title: v.title,
                        nowm: videoUrl, 
                        author: v.author.nickname || 'TikTok User',
                        origin_url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
                    }
                })
            }
        } catch (e) {
            console.log("Error en TikWM:", e)
            try {
                let { data: response } = await axios.get('https://api.agatz.xyz/api/tiktoksearch?message=' + text)
                searchResults = response.data.map(v => ({...v, author: 'TikTok User'})) // Adaptación simple
            } catch (e2) { console.log("Error en Agatz:", e2) }
        }

        if (!searchResults || !searchResults.length) return conn.reply(m.chat, '❌ No encontré nada, intenta con otra palabra.', m)

        shuffleArray(searchResults)
        // 🔥 IMPORTANTE: Reducimos a 5 videos para que el mensaje "Carousel" no sea muy pesado y cargue rápido.
        let selectedResults = searchResults.splice(0, 5)

        // --- CONSTRUCCIÓN DEL CARRUSEL (CARDS) ---
        
        // Mapeamos los resultados al formato de Cards de tu documentación
        const cardsData = selectedResults.map(result => {
            return {
                // Aquí usamos 'video' según tu documentación, pasando la URL
                video: { url: result.nowm }, 
                title: toFancy(result.title.substring(0, 40) + '...'), // Título corto y bonito
                body: `👤 ${result.author}`, // El cuerpo de la tarjeta
                footer: toFancy('Tiktok Search Result'), // Footer estético
                buttons: [
                    {
                        // Botón para ir al enlace original (útil para verificar)
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🔗 Ver Original',
                            url: result.origin_url || 'https://tiktok.com'
                        })
                    },
                    // Puedes agregar un botón de copiado si quieres
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Copiar Enlace',
                            copy_code: result.nowm
                        })
                    }
                ]
            }
        })

        // --- ENVÍO DEL MENSAJE ESTÉTICO ---
        await conn.sendMessage(m.chat, {
            text: `${toFancy("Aquí tienes los mejores resultados para:")} *${text}*`,
            footer: 'Desliza para ver más ➡️',
            cards: cardsData // Enviamos el array de tarjetas creado arriba
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        await m.react('❌')
        console.error(error)
        // Fallback: Si fallan las Cards (por versión de WA), envía mensaje simple.
        await conn.reply(m.chat, 'Ocurrió un error al generar la galería. ' + error.toString(), m)
    }
}

handler.help = ['tiktoksearch <txt>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true

export default handler