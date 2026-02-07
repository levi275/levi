import { ytmp3, ytmp4 } from "../lib/youtubedl.js"
import yts from "yt-search"
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { tmpdir } from 'os'

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/

// Función para procesar video con FFmpeg (Igual que en tu comando de GIFs pero adaptado para video con audio)
function reprocesarVideo(videoBuffer) {
    return new Promise((resolve, reject) => {
        const tempInput = path.join(tmpdir(), `${Date.now()}_in.mp4`)
        const tempOutput = path.join(tmpdir(), `${Date.now()}_out.mp4`)
        
        fs.writeFileSync(tempInput, videoBuffer)

        // Argumentos clave para WhatsApp: libx264, aac, yuv420p
        const ffmpeg = spawn('ffmpeg', [
            '-y', 
            '-i', tempInput, 
            '-c:v', 'libx264', 
            '-c:a', 'aac',       // Asegura que el audio sea compatible
            '-b:a', '128k',      // Bitrate de audio decente
            '-pix_fmt', 'yuv420p', 
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Asegura dimensiones pares
            '-movflags', '+faststart', 
            tempOutput
        ])

        ffmpeg.on('close', code => {
            fs.unlinkSync(tempInput) // Borrar entrada
            if (code === 0) {
                const resultBuffer = fs.readFileSync(tempOutput)
                fs.unlinkSync(tempOutput) // Borrar salida temporal
                resolve(resultBuffer)
            } else {
                reject(new Error(`FFmpeg falló con código ${code}`))
            }
        })

        ffmpeg.on('error', err => {
            try { fs.unlinkSync(tempInput) } catch(e) {}
            try { fs.unlinkSync(tempOutput) } catch(e) {}
            reject(err)
        })
    })
}

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text || !text.trim()) {
      return conn.reply(m.chat, `✧ 𝙃𝙚𝙮! Debes escribir *el nombre o link* del video/audio para descargar.`, m)
    }

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key }})

    let videoIdToFind = text.match(youtubeRegexID)
    let ytplay2 = await yts(videoIdToFind ? "https://youtu.be/" + videoIdToFind[1] : text)

    if (videoIdToFind) {
      const videoId = videoIdToFind[1]
      ytplay2 = ytplay2.all.find(item => item.videoId === videoId) || ytplay2.videos.find(item => item.videoId === videoId)
    }

    ytplay2 = ytplay2?.all?.[0] || ytplay2?.videos?.[0] || ytplay2
    if (!ytplay2) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
      return m.reply("⚠︎ No encontré resultados, intenta con otro nombre o link.")
    }

    let { title, thumbnail, timestamp, views, ago, url, author } = ytplay2
    const vistas = formatViews(views)
    const canal = author?.name || "Desconocido"

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

    const thumb = (await conn.getFile(thumbnail))?.data
    await conn.reply(m.chat, infoMessage, m, {
      contextInfo: {
        externalAdReply: {
          title: "Bot Name", // Cambia esto por tu variable botname
          body: "YouTube Downloader", // Cambia esto por tu variable dev
          mediaType: 1,
          thumbnail: thumb,
          renderLargerThumbnail: true,
          mediaUrl: url,
          sourceUrl: url
        }
      }
    })

    // --- SECCIÓN DE AUDIO ---
    if (["play", "yta", "ytmp3", "playaudio"].includes(command)) {
      let audioData = null
      try {
        const r = await ytmp3(url)
        if (r?.status && r?.download?.url) {
          audioData = { link: r.download.url, title: r.metadata?.title }
        }
      } catch (e) {
        console.error(e)
      }

      if (!audioData) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
        return conn.reply(m.chat, "✦ No se pudo descargar el audio. Intenta más tarde.", m)
      }

      // Descargamos el audio como buffer para asegurar envío
      const audioBufferRes = await axios.get(audioData.link, { responseType: 'arraybuffer' })
      
      await conn.sendMessage(m.chat, {
        audio: audioBufferRes.data,
        fileName: `${audioData.title || "music"}.mp3`,
        mimetype: "audio/mpeg",
        ptt: false
      }, { quoted: m })

      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})
    }

    // --- SECCIÓN DE VIDEO ---
    else if (["play2", "ytv", "ytmp4", "mp4"].includes(command)) {
      let videoData = null
      try {
        const r = await ytmp4(url)
        if (r?.status && r?.download?.url) {
          videoData = { link: r.download.url, title: r.metadata?.title }
        }
      } catch (e) {
        console.error(e)
      }

      if (!videoData) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
        return conn.reply(m.chat, "✦ No se pudo descargar el video. Intenta más tarde.", m)
      }

      // 1. Descargamos el video crudo
      const videoResponse = await axios.get(videoData.link, { responseType: 'arraybuffer' })
      
      // 2. Procesamos con FFMPEG (Esto soluciona lo borroso/fallo)
      let finalBuffer
      try {
          finalBuffer = await reprocesarVideo(videoResponse.data)
      } catch (err) {
          console.error("Error al procesar video, enviando crudo:", err)
          finalBuffer = videoResponse.data // Fallback si ffmpeg falla
      }

      // 3. Enviamos el buffer procesado
      await conn.sendMessage(m.chat, {
        video: finalBuffer,
        fileName: `${videoData.title || "video"}.mp4`,
        caption: `${title}`,
        mimetype: "video/mp4"
      }, { quoted: m })

      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})
    }

  } catch (error) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
    console.error(error)
    return m.reply(`⚠︎ Error inesperado. Por favor, reporta este problema.`)
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
