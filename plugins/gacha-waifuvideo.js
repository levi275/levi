import axios from 'axios'

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        return conn.reply(m.chat, "《✧》Debes escribir el nombre del personaje.", m)
    }

    const name = args.join(' ').toLowerCase()

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === name)

        if (!character) {
            return conn.reply(m.chat, `《✧》No encontré a *${name}*.`, m)
        }

        if (!character.vid || character.vid.length === 0) {
            return conn.reply(m.chat, `《✧》No hay videos para *${character.name}*.`, m)
        }

        const url = character.vid[Math.floor(Math.random() * character.vid.length)]
        const isGif = url.endsWith(".gif")

        const caption = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`

        const buffer = (await axios.get(url, { responseType: "arraybuffer" })).data

        await conn.sendMessage(
            m.chat,
            {
                video: buffer,
                caption,
                gifPlayback: isGif
            },
            { quoted: m }
        )

    } catch (e) {
        console.error(e)
        conn.reply(m.chat, "✘ No pude enviar el video.", m)
    }
}

export default handler
