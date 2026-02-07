import { ytmp3, ytmp4 } from "../lib/youtubedl.js"
import yts from "yt-search"
import axios from "axios"

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text || !text.trim()) {
      return conn.reply(m.chat, `✧ 𝙃𝙚𝙮! Debes escribir *el nombre o link* del video/audio para descargar.`, m)
    }

    // Reacción de "Buscando"
    await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key }})

    // 1. Búsqueda inteligente (ID o Texto)
    let videoIdToFind = text.match(youtubeRegexID)
    let searchUrl = videoIdToFind ? "https://youtu.be/" + videoIdToFind[1] : text
    
    let ytplay2 = await yts(searchUrl)

    // Filtrado preciso si se usó un link
    if (videoIdToFind) {
      const videoId = videoIdToFind[1]
      ytplay2 = ytplay2.all.find(item => item.videoId === videoId) || ytplay2.videos.find(item => item.videoId === videoId)
    }

    // Fallback al primer resultado
    ytplay2 = ytplay2?.all?.[0] || ytplay2?.videos?.[0] || ytplay2

    if (!ytplay2) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
      return m.reply("⚠︎ No encontré resultados, intenta con otro nombre o link.")
    }

    let { title, thumbnail, timestamp, views, ago, url, author } = ytplay2
    const vistas = formatViews(views)
    const canal = author?.name || "Desconocido"

    // Tarjeta de información
    const infoMessage = `
ㅤ۫ ㅤ  🦭 ୧  ˚ \`𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂 𝒆𝒏 𝒄𝒂𝒎𝒊𝒏𝒐\` !  ୨ 𖹭  ִֶָ  

᮫ؙܹ  ᳘︵᮫ּܹ࡛〫ࣥܳ⌒ؙ۫ ᮫ּ۪֯⏝ֺ࣯࠭۟ ᮫ּ〪࣭︶᮫ܹ᳟〫࠭߳፝֟᷼⏜᮫᮫ּ〪࣭࠭〬︵᮫ּ᳝̼࣪ 🍚⃘ᩚּ̟߲ ּ〪࣪︵᮫࣭࣪࠭ᰯּ〪࣪࠭⏜ְ࣮〫߳ ᮫ּׅ࣪۟︶᮫ܹׅ࠭〬 ᮫ּּ࣭᷼⏝ᩥ᮫〪ܹ۟࠭۟۟ ᮫ּؙ⌒᮫ܹ۫︵ᩝּּ۟࠭ ࣭۪۟
> 🧊✿⃘࣪◌ ֪ \`𝗧𝗶́𝘁𝘂𝗹𝗼\` » *${title}*
> 🧊✿⃘࣪◌ ֪ \`𝗖𝗮𝗻𝗮𝗹\` » *${canal}*
> 🧊✿⃘࣪◌ ֪ \`𝗗𝘂𝗿𝗮𝗰𝗶𝗼́𝗻\` » *${timestamp}*
> 🧊✿⃘࣪◌ ֪ \`𝗩𝗶𝘀𝘁𝗮𝘀\` » *${vistas}*
> 🧊✿⃘࣪◌ ֪ \`𝗣𝘂𝗯𝗹𝗶𝗰𝗮𝗱𝗼\` » *${ago}*
> 🧊✿⃘࣪◌ ֪ \`𝗟𝗶𝗻𝗸\` » ${url}

> 𐙚 🪵 ｡ Preparando tu descarga... ˙𐙚
    `.trim()

    // Enviamos la tarjeta
    // Nota: Usamos una imagen buffer pequeña si es posible para que cargue rápido
    const thumb = (await conn.getFile(thumbnail))?.data
    await conn.reply(m.chat, infoMessage, m, {
      contextInfo: {
        externalAdReply: {
          title: "Bot Name", // Pon tu variable de nombre bot
          body: "YouTube Downloader", 
          mediaType: 1,
          thumbnail: thumb,
          renderLargerThumbnail: true,
          mediaUrl: url,
          sourceUrl: url
        }
      }
    })
    
    // Cambiamos reacción a "Cargando/Descargando"
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key }})

    // ==========================================
    // SECCIÓN DE AUDIO (MP3)
    // ==========================================
    if (["play", "yta", "ytmp3", "playaudio"].includes(command)) {
      try {
        const item = await ytmp3(url)
        if (!item?.status || !item?.download?.url) {
             throw new Error("Sin enlace de descarga")
        }

        // Descarga directa a RAM (Buffer) - Más rápido que escribir en disco
        const { data } = await axios.get(item.download.url, { 
            responseType: "arraybuffer" 
        })

        await conn.sendMessage(m.chat, { 
            audio: data, 
            fileName: `${item.metadata.title}.mp3`, 
            mimetype: "audio/mpeg" 
        }, { quoted: m })

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})

      } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
        m.reply("⚠️ Error al descargar el audio. Intenta de nuevo.")
      }
    }

    // ==========================================
    // SECCIÓN DE VIDEO (MP4)
    // ==========================================
    else if (["play2", "ytv", "ytmp4", "mp4"].includes(command)) {
      try {
        const item = await ytmp4(url)
        if (!item?.status || !item?.download?.url) {
             throw new Error("Sin enlace de descarga")
        }

        // Descarga directa a RAM (Buffer)
        // La librería ya fuerza H.264 y 360p, así que NO necesitamos FFmpeg
        const { data } = await axios.get(item.download.url, { 
            responseType: "arraybuffer" 
        })

        await conn.sendMessage(m.chat, { 
            video: data, 
            fileName: `${item.metadata.title}.mp4`, 
            caption: `🎬 *${title}*`, 
            mimetype: "video/mp4" 
        }, { quoted: m })

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})

      } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
        m.reply("⚠️ Error al descargar el video. Puede que sea muy pesado.")
      }
    }

  } catch (error) {
    console.error(error)
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
    return m.reply(`⚠︎ Error inesperado.`)
  }
}

handler.command = ["play", "yta", "ytmp3", "play2", "ytv", "ytmp4", "playaudio", "mp4"]
handler.help = ["play", "yta", "ytmp3", "play2", "ytv", "ytmp4", "playaudio", "mp4"]
handler.tags = ["descargas"]

export default handler

function formatViews(views) {
  if (!views) return "No disponible"
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`
  return views.toString()
}
