import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import { spawn } from 'child_process'

const charactersFilePath = './src/database/characters.json'
const tmpVideo = './tmpvideo.mp4'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch {
        throw new Error('❀ No se pudo cargar el archivo characters.json.')
    }
}

async function downloadVideo(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('No se pudo descargar el video')
    return Buffer.from(await res.arrayBuffer())
}

async function convertToMp4(inputBuffer) {
    await fs.writeFile(tmpVideo, inputBuffer)
    return new Promise((resolve, reject) => {
        const output = './out.mp4'
        const ff = spawn('ffmpeg', ['-y','-i', tmpVideo,'-c:v','libx264','-c:a','aac','-movflags','faststart',output])
        ff.on('close', async (code) => {
            if (code !== 0) return reject(new Error('Error al convertir el video'))
            const converted = await fs.readFile(output)
            await fs.unlink(tmpVideo).catch(() => {})
            await fs.unlink(output).catch(() => {})
            resolve(converted)
        })
    })
}

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        await conn.reply(m.chat, '《✧》Por favor, proporciona el nombre de un personaje.', m)
        return
    }

    const characterName = args.join(' ').toLowerCase().trim()

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === characterName)

        if (!character) {
            await conn.reply(m.chat, `《✧》No se encontró el personaje *${characterName}*.`, m)
            return
        }

        if (!character.vid?.length) {
            await conn.reply(m.chat, `《✧》No se encontró video para *${character.name}*.`, m)
            return
        }

        const url = character.vid[Math.floor(Math.random() * character.vid.length)]
        let videoBuffer = null

        try {
            videoBuffer = await downloadVideo(url)
        } catch {
            throw new Error('El enlace del video es inválido o no permite descargas.')
        }

        const mp4Buffer = await convertToMp4(videoBuffer)

        const message = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`

        await conn.sendMessage(m.chat, { video: mp4Buffer, caption: message }, { quoted: m })

    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar el video: ${error.message}`, m)
    }
}

handler.help = ['wvideo <nombre del personaje>']
handler.tags = ['anime']
handler.command = ['charvideo', 'wvideo', 'waifuvideo']
handler.group = true

export default handler
