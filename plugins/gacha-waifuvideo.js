import { promises as fs } from 'fs'
import axios from 'axios'

const charactersFilePath = './src/database/characters.json'
const haremFilePath = './src/database/harem.json'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('❀ No se pudo cargar el archivo characters.json.')
    }
}

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

let handler = async (m, { conn, command, args }) => {
    if (args.length === 0) {
        await conn.reply(m.chat, `《✧》Por favor, proporciona el nombre de un personaje.`, m)
        return
    }

    const characterName = args.join(' ').toLowerCase().trim()

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === characterName)

        if (!character) {
            await conn.reply(m.chat, `《✧》No se ha encontrado el personaje *${characterName}*. Asegúrate de que el nombre esté correcto.`, m)
            return
        }

        if (!character.vid || character.vid.length === 0) {
            await conn.reply(m.chat, `《✧》No se encontró un video para *${character.name}*.`, m)
            return
        }

        const randomVideo = character.vid[Math.floor(Math.random() * character.vid.length)]
        const isGif = randomVideo.endsWith('.gif') || randomVideo.endsWith('.GIF')

        const message = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`

        let buffer
        try {
            const response = await axios.get(randomVideo, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            })
            buffer = response.data
        } catch (error) {
            console.error("❌ Error descargando video: ", error)
            await conn.reply(m.chat, `✘ No pude descargar el video desde:\n${randomVideo}`, m)
            return
        }

        try {
            await conn.sendMessage(
                m.chat,
                {
                    video: buffer,
                    caption: message,
                    gifPlayback: isGif
                },
                { quoted: m }
            )
        } catch (error) {
            console.error("❌ Error enviando video a WhatsApp: ", error)
            await conn.reply(m.chat, `✘ Hubo un error al enviar el video.`, m)
        }

    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar el video del personaje: ${error.message}`, m)
    }
}

handler.help = ['wvideo <nombre del personaje>']
handler.tags = ['anime']
handler.command = ['charvideo', 'wvideo', 'waifuvideo']
handler.group = true

export default handler
