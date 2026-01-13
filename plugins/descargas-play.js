import fs from "fs"
import { ytmp3, ytmp4 } from "../lib/youtubedl.js"
import yts from "yt-search"

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/
const ERROR_LOG = "./src/logs/ytdl-errors.log"
const OWNER = global.owner?.[0] || null // asegúrate de tener global.owner

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text.trim()) {
      return conn.reply(m.chat, `✧ 𝙃𝙚𝙮! Debes escribir *el nombre o link* del video/audio para descargar.`, m)
    }

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key }})

    let videoIdToFind = text.match(youtubeRegexID) || null
    let ytplay2 = await yts(videoIdToFind ? "https://youtu.be/" + videoIdToFind[1] : text)

    if (videoIdToFind) {
      const videoId = videoIdToFind[1]
      ytplay2 = ytplay2.all.find(item => item.videoId === videoId) || ytplay2.videos.find(item => item.videoId === videoId)
    }

    ytplay2 = ytplay2.all?.[0] || ytplay2.videos?.[0] || ytplay2
    if (!ytplay2) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
      return m.reply("⚠︎ No encontré resultados, intenta con otro nombre o link.")
    }

    let { title, thumbnail, timestamp, views, ago, url, author } = ytplay2
    const vistas = formatViews(views)
    const canal = author?.name || "Desconocido"

    const thumb = (await conn.getFile(thumbnail))?.data
    await conn.reply(m.chat, `🎧 *${title}*\n📺 ${canal}\n⏱ ${timestamp}\n👁 ${vistas}`, m, {
      contextInfo: {
        externalAdReply: {
          title: botname,
          body: dev,
          mediaType: 1,
          thumbnail: thumb,
          renderLargerThumbnail: true,
          mediaUrl: url,
          sourceUrl: url
        }
      }
    })

    /* ================= AUDIO ================= */

    if (["play", "yta", "ytmp3", "playaudio"].includes(command)) {
      let audioData = null
      let audioError = null

      try {
        const r = await ytmp3(url)
        if (r?.status && r?.download?.url) {
          audioData = { link: r.download.url, title: r.metadata?.title }
        } else {
          audioError = "Servidor no devolvió un link válido."
        }
      } catch (e) {
        audioError = parseError(e)
        fullErrorLog("AUDIO", e, url)
        notifyOwner(conn, e, url, "AUDIO")
      }

      if (!audioData) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
        return conn.reply(m.chat, `✦ No se pudo descargar el audio.\n\n📛 *Causa:*\n${humanError(audioError)}`, m)
      }

      await conn.sendMessage(m.chat, {
        audio: { url: audioData.link },
        fileName: `${audioData.title || "music"}.mp3`,
        mimetype: "audio/mpeg"
      }, { quoted: m })

      return conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})
    }

    /* ================= VIDEO ================= */

    if (["play2", "ytv", "ytmp4", "mp4"].includes(command)) {
      let videoData = null
      let videoError = null

      try {
        const r = await ytmp4(url)
        if (r?.status && r?.download?.url) {
          videoData = { link: r.download.url, title: r.metadata?.title }
        } else {
          videoError = "Servidor no devolvió un link válido."
        }
      } catch (e) {
        videoError = parseError(e)
        fullErrorLog("VIDEO", e, url)
        notifyOwner(conn, e, url, "VIDEO")
      }

      if (!videoData) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
        return conn.reply(m.chat, `✦ No se pudo descargar el video.\n\n📛 *Causa:*\n${humanError(videoError)}`, m)
      }

      await conn.sendMessage(m.chat, {
        video: { url: videoData.link },
        fileName: `${videoData.title || "video"}.mp4`,
        caption: title,
        mimetype: "video/mp4"
      }, { quoted: m })

      return conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})
    }

  } catch (error) {
    fullErrorLog("GENERAL", error, text)
    notifyOwner(conn, error, text, "GENERAL")
    console.error(error)
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
    return m.reply("⚠️ Error interno grave. El owner ya fue notificado.")
  }
}

handler.command = handler.help = ["play", "yta", "ytmp3", "play2", "ytv", "ytmp4", "playaudio", "mp4"]
handler.tags = ["descargas"]
export default handler

/* ================= HERRAMIENTAS ================= */

function parseError(e) {
  if (!e) return "Error desconocido"
  if (typeof e === "string") return e
  if (e.response?.status) return `HTTP ${e.response.status} - ${e.response.statusText}`
  if (e.message) return e.message
  return JSON.stringify(e, null, 2)
}

function humanError(msg = "") {
  const m = msg.toLowerCase()

  if (m.includes("403")) return "🚫 YouTube bloqueó la descarga (403)."
  if (m.includes("429")) return "⚠️ Demasiadas peticiones. Espera unos minutos."
  if (m.includes("copyright")) return "©️ Video con restricción de copyright."
  if (m.includes("age")) return "🔞 Video con restricción de edad."
  if (m.includes("private")) return "🔒 Video privado."
  if (m.includes("unavailable")) return "❌ Video no disponible."
  if (m.includes("ffmpeg")) return "🎞 Error interno de conversión (ffmpeg)."

  return msg.slice(0, 800)
}

function fullErrorLog(type, error, extra = "") {
  try {
    if (!fs.existsSync("./src/logs")) fs.mkdirSync("./src/logs")
    const log = `\n\n[${new Date().toLocaleString()}] [${type}]
${extra}
${error?.stack || error}`

    fs.appendFileSync(ERROR_LOG, log)
  } catch (e) {
    console.error("NO SE PUDO ESCRIBIR LOG:", e)
  }
}

async function notifyOwner(conn, error, query, type) {
  try {
    if (!OWNER) return
    const msg = `🚨 *ERROR YTDL (${type})*

🔎 Búsqueda:
${query}

📛 Error:
${error?.stack || error}`

    await conn.sendMessage(OWNER + "@s.whatsapp.net", { text: msg })
  } catch {}
}

function formatViews(views) {
  if (!views) return "No disponible"
  if (views >= 1e9) return (views / 1e9).toFixed(1) + "B"
  if (views >= 1e6) return (views / 1e6).toFixed(1) + "M"
  if (views >= 1e3) return (views / 1e3).toFixed(1) + "k"
  return views.toString()
}
