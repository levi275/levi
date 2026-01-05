import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters.json'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('❀ No se pudo cargar la base de datos de personajes.')
    }
}

let handler = async (m, { conn, args }) => {
    const text = args.join(' ')
    if (!text) return conn.reply(m.chat, '❀ Por favor, ingresa el nombre de una serie o anime. Ejemplo: `#ainfo fire force`', m)

    try {
        const allCharacters = await loadCharacters()
        
        // 1. Filtrar personajes que coincidan con la serie buscada (ignorando mayúsculas/minúsculas)
        const animeChars = allCharacters.filter(c => 
            c.source.toLowerCase().includes(text.toLowerCase())
        )

        if (animeChars.length === 0) return conn.reply(m.chat, `❀ No se encontraron personajes para: "${text}"`, m)

        // 2. Obtener el nombre real de la serie (del primer resultado encontrado)
        const realAnimeName = animeChars[0].source
        const totalChars = animeChars.length
        
        // 3. Calcular estadísticas de reclamos
        const claimedChars = animeChars.filter(c => c.user)
        const claimedCount = claimedChars.length
        const percentage = ((claimedCount / totalChars) * 100).toFixed(0)

        // 4. Manejo de paginación
        let pageArg = args.find(arg => /^\d+$/.test(arg))
        const page = parseInt(pageArg) || 1
        const perPage = 25 // Mostramos 25 personajes por página para no saturar
        const totalPages = Math.ceil(totalChars / perPage)
        const startIndex = (page - 1) * perPage
        const endIndex = Math.min(startIndex + perPage, totalChars)

        if (page < 1 || page > totalPages) return conn.reply(m.chat, `❀ Página no válida. Esta serie tiene *${totalPages}* páginas.`, m)

        // 5. Construir el mensaje
        let message = `*❀ Nombre: \`<${realAnimeName}>\`*\n\n`
        message += `❏ Personajes » *\`${totalChars}\`*\n`
        message += `♡ Reclamados » *\`${claimedCount}/${totalChars} (${percentage}%)\`*\n`
        message += `❏ Lista de personajes:\n`
        
        // Espacio invisible para el diseño (opcional, como el ejemplo)
        message += `​​\n`

        const listSlice = animeChars
            .sort((a, b) => b.value - a.value) // Ordenar por valor de mayor a menor
            .slice(startIndex, endIndex)

        for (const char of listSlice) {
            const status = char.user 
                ? `Reclamado por ${await conn.getName(char.user).catch(() => char.user.split('@')[0])}` 
                : 'Libre.'
            
            message += `» *${char.name}* (${char.id}) • ${status}\n`
        }

        message += `\n> ⌦ _Pagina *${page}* de *${totalPages}*_`

        await conn.reply(m.chat, message, m)

    } catch (error) {
        console.error(error)
        await conn.reply(m.chat, `✘ Error al buscar información del anime.`, m)
    }
}

handler.help = ['ainfo <anime> [página]']
handler.tags = ['gacha']
handler.command = ['ainfo', 'animeinfo', 'series']
handler.group = true

export default handler