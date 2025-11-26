import axios from 'axios'
import cheerio from 'cheerio'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    // Definimos los canales/contextos por seguridad, igual que en tu ejemplo de Pinterest
    const ctxErr = (global.rcanalx || {})
    const ctxWarn = (global.rcanalw || {})
    const ctxOk = (global.rcanalr || {})

    // Verificar si hay texto
    if (!text) return conn.reply(m.chat, `🍟 *Ingresa lo que deseas buscar en Google.*`, m, ctxWarn)

    try {
        // Reacción de espera
        await m.react('🔍')

        // Realizamos la búsqueda usando la función personalizada abajo
        const results = await googleSearch(text)

        if (!results || results.length === 0) {
            return conn.reply(m.chat, `⚠️ No se encontraron resultados para: ${text}`, m, ctxWarn)
        }

        // Construimos el mensaje de respuesta
        let teks = `🍟 *Resultado de Google* : ${text}\n\n`
        
        // Limitamos a los primeros 5 resultados para no saturar el chat
        for (let g of results.slice(0, 5)) {
            teks += `🐢 *Titulo ∙* ${g.title}\n`
            teks += `🚩 *Info ∙* ${g.snippet}\n`
            teks += `🔗 *Url ∙* ${g.link}\n\n`
        }

        // Enviamos el mensaje con una imagen de cabecera (thumbnail)
        // Puedes cambiar la url de la imagen si deseas
        await conn.sendMessage(m.chat, {
            text: teks,
            contextInfo: {
                externalAdReply: {
                    mediaUrl: results[0].link,
                    mediaType: 1,
                    description: 'Google Search',
                    title: '🔎 Google Search Engine',
                    body: 'Resultados encontrados',
                    previewType: 0,
                    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/1024px-Google_%22G%22_Logo.svg.png',
                    sourceUrl: results[0].link
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('✖️')
        conn.reply(m.chat, `⚠️ Ocurrió un error al buscar.\n> Intenta de nuevo más tarde.`, m, ctxErr)
    }
}

handler.help = ['google <búsqueda>']
handler.tags = ['buscador']
handler.command = ['google', 'googlef']
handler.group = true
handler.register = true

export default handler

/* FUNCION DE BÚSQUEDA PERSONALIZADA 
   (Reemplaza a google-it y bochilteam)
*/
async function googleSearch(query) {
    try {
        // Usamos una URL con parámetros para simular una búsqueda real
        const url = 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&hl=es'
        
        // Headers importantes para evitar bloqueos (User-Agent de navegador real)
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            }
        })

        const $ = cheerio.load(data)
        const results = []

        // Buscamos los bloques de resultados estándar de Google (div.g)
        $('div.g').each((i, elem) => {
            const titleElement = $(elem).find('h3')
            const linkElement = $(elem).find('a')
            const snippetElement = $(elem).find('div.VwiC3b, div.IsZvec') // Clases comunes de descripciones

            const title = titleElement.text()
            const link = linkElement.attr('href')
            const snippet = snippetElement.text()

            // Solo agregamos si tiene título y enlace válido
            if (title && link && !link.includes('google.com/search')) {
                results.push({
                    title: title,
                    link: link,
                    snippet: snippet || 'Sin descripción disponible.'
                })
            }
        })

        return results
    } catch (error) {
        console.error("Error en googleSearch:", error)
        return []
    }
}