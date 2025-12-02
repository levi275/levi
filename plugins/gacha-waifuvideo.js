import { promises as fs } from 'fs'
import axios from 'axios'

const charactersFilePath = './src/database/characters.json'
const haremFilePath = './src/database/harem.json'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch {
        throw new Error('❀ No se pudo cargar el archivo characters.json.')
    }
}

async function convertGifToMp4(url) {
    try {
        const api = `https://api.gif2mp4.xyz/?url=${encodeURIComponent(url)}`
        const res = await axios.get(api)
        if (res.data && res.data.mp4) return res.data.mp4
        return null
    } catch {
        return null
    }
}

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        return conn.reply(m.chat, `《✧》Debes escribir el nombre del personaje.`, m)
    }

    const name = args.join(' ').toLowerCase().trim()

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === name)

        if (!character) {
            return conn.reply(m.chat, `《✧》No se encontró a *${name}*.`, m)
        }

        if (!character.vid?.length) {
            return conn.reply(m.chat, `《✧》No hay videos para *${character.name}*.`, m)
        }

        let url = character.vid[Math.floor(Math.random() * character.vid.length)]
        const isGif = url.endsWith('.gif')

        // Si es GIF → convertirlo automáticamente
        if (isGif) {
            const converted = await convertGifToMp4(url)
            if (converted) {
                url = converted
            } else {
                return conn.reply(m.chat, "✘ No pude convertir el GIF de Pinterest.", m)
            }
        }

        const caption = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`

        // Descargar video o MP4 convertido
        const buffer = (await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })).data

        // Enviar como video real
        await conn.sendMessage(
            m.chat,
            { video: buffer, caption },
            { quoted: m }
        )

    } catch (e) {
        console.error(e)
        conn.reply(m.chat, `✘ Error al enviar el video.`, m)
    }
}

handler.help = ['wvideo <nombre>']
handler.tags = ['anime']
handler.command = ['charvideo', 'wvideo', 'waifuvideo']
handler.group = true

export default handler
