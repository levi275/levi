import { promises as fs } from 'fs'
import axios from 'axios'
import { tmpdir } from 'os'
import path from 'path'

const charactersFilePath = './src/database/characters.json'
const haremFilePath = './src/database/harem.json'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('❀ No se pudo cargar characters.json.')
    }
}

async function downloadToMp4(url) {
    try {
        const tempPath = path.join(tmpdir(), `video_${Date.now()}.mp4`)
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        await fs.writeFile(tempPath, response.data)
        return tempPath
    } catch {
        return null
    }
}

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        return conn.reply(m.chat, `《✧》Por favor, proporciona el nombre de un personaje.`, m)
    }

    const characterName = args.join(' ').toLowerCase().trim()

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === characterName)

        if (!character) {
            return conn.reply(m.chat, `《✧》No se encontró el personaje *${characterName}*.`, m)
        }

        if (!character.vid || character.vid.length === 0) {
            return conn.reply(m.chat, `《✧》No hay videos para *${character.name}*.`, m)
        }

        const randomVideo = character.vid[Math.floor(Math.random() * character.vid.length)]

        const msg = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`

        let videoPath = randomVideo

        if (!randomVideo.endsWith('.mp4')) {
            videoPath = await downloadToMp4(randomVideo)
            if (!videoPath) {
                return conn.reply(m.chat, `✘ Error: WhatsApp no acepta este tipo de video.`, m)
            }
        }

        await conn.sendMessage(
            m.chat,
            { video: videoPath, caption: msg },
            { quoted: m }
        )

        if (videoPath !== randomVideo) {
            setTimeout(() => fs.unlink(videoPath), 5000)
        }

    } catch (e) {
        await conn.reply(m.chat, `✘ Error al reproducir el video: ${e.message}`, m)
    }
}

handler.help = ['wvideo <nombre>']
handler.tags = ['anime']
handler.command = ['charvideo', 'wvideo', 'waifuvideo']
handler.group = true

export default handler
