import { googleIt } from '@bochilteam/scraper'
import axios from 'axios'

let handler = async (m, { conn, command, args, usedPrefix }) => {
    const text = args.join` `
    if (!text) return conn.reply(m.chat, '🍟 Ingresa lo que deseas buscar en Google.', m, rcanal)
    
    // Mensaje de espera
    conn.reply(m.chat, `🚩 Buscando Su Información...`, m, {
        contextInfo: { 
            externalAdReply: { 
                mediaUrl: null, 
                mediaType: 1, 
                showAdAttribution: true,
                title: packname,
                body: wm,
                previewType: 0, 
                thumbnail: icons,
                sourceUrl: channel 
            }
        }
    })

    try {
        // Usamos la función del scraper que es más efectiva
        const res = await googleIt(text)
        
        // Verificamos si la respuesta está vacía o no es un array
        if (!res || res.length === 0) {
            return conn.reply(m.chat, '❌ No se encontraron resultados. Intenta con otra búsqueda.', m, rcanal)
        }

        let teks = `🍟 *Resultado de* : ${text}\n\n`
        
        // Iteramos sobre los resultados
        for (let g of res) {
            teks += `🐢 *Titulo ∙* ${g.title}\n🚩 *Info ∙* ${g.snippet}\n🔗 *Url ∙* ${g.link}\n\n`
        }
        
        conn.reply(m.chat, teks, m, rcanal)

    } catch (e) {
        console.error(e)
        conn.reply(m.chat, '❌ Ocurrió un error al intentar buscar. Intenta más tarde.', m, rcanal)
    }
}

handler.help = ['google <búsqueda>']
handler.tags = ['buscador']
handler.command = ['google']
handler.group = true
handler.register = true

export default handler