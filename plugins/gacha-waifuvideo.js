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

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        return await conn.reply(m.chat, `《✧》Debes escribir el nombre del personaje.`, m)
    }

    const characterName = args.join(' ').toLowerCase().trim()

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === characterName)

        if (!character) {
            return conn.reply(m.chat, `《✧》No se encontró a *${characterName}*.`, m)
        }

        if (!character.vid || character.vid.length === 0) {
            return conn.reply(m.chat, `《✧》No hay videos para *${character.name}*.`, m)
        }

        const randomVideo = character.vid[Math.floor(Math.random() * character.vid.length)]
        const message = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`

        const isGif = randomVideo.endsWith('.gif')

        try {
            if (isGif) {
                await conn.sendMessage(m.chat, {
                    video: { url: randomVideo },
                    gifPlayback: true,
                    caption: message,
                }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, {
                    video: { url: randomVideo },
                    caption: message,
                }, { quoted: m })
            }
            return
        } catch (e) {
            console.log("❌ Envío directo falló, intentando descarga → reenvío")
        }

        const buffer = (await axios.get(randomVideo, { responseType: "arraybuffer" })).data

        await conn.sendMessage(m.chat, {
            video: buffer,
            caption: message,
            gifPlayback: isGif,
        }, { quoted: m })

    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar video: ${error.message}`, m)
    }
}

handler.help = ['wvideo <personaje>']
handler.tags = ['anime']
handler.command = ['charvideo', 'wvideo', 'waifuvideo']
handler.group = true

export default handler
