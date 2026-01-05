import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters.json'

// Función de "IA" para calcular similitud de texto
function similarity(s1, s2) {
    let longer = s1.toLowerCase();
    let shorter = s2.toLowerCase();
    if (longer.length < shorter.length) { [longer, shorter] = [shorter, longer]; }
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    let costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('❀ No se pudo cargar la base de datos.')
    }
}

let handler = async (m, { conn, args }) => {
    let query = args.join(' ').replace(/\d+$/, '').trim() // Separamos el nombre del posible número de página
    if (!query) return conn.reply(m.chat, '❀ Ingresa el nombre de una serie. Ejemplo: `#ainfo fire force`', m)

    try {
        const allCharacters = await loadCharacters()
        
        // Obtener todas las series únicas de la base de datos
        const allSources = [...new Set(allCharacters.map(c => c.source))]
        
        // Buscar coincidencia exacta o parcial
        let bestMatch = allSources.find(s => s.toLowerCase() === query.toLowerCase())
        
        // Si no hay coincidencia exacta, activar la "IA" de búsqueda
        if (!bestMatch) {
            let matches = allSources.map(s => ({ source: s, score: similarity(query, s) }))
            matches.sort((a, b) => b.score - a.score)
            
            if (matches[0].score > 0.4) { // Umbral de confianza
                bestMatch = matches[0].source
            }
        }

        if (!bestMatch) return conn.reply(m.chat, `✘ No pude encontrar ninguna serie que se parezca a "${query}".`, m)

        const animeChars = allCharacters.filter(c => c.source === bestMatch)
        const totalChars = animeChars.length
        const claimedChars = animeChars.filter(c => c.user)
        const claimedCount = claimedChars.length
        const percentage = ((claimedCount / totalChars) * 100).toFixed(0)

        // Paginación
        let pageArg = args.find(arg => /^\d+$/.test(arg))
        const page = parseInt(pageArg) || 1
        const perPage = 25
        const totalPages = Math.ceil(totalChars / perPage)
        const startIndex = (page - 1) * perPage
        const endIndex = Math.min(startIndex + perPage, totalChars)

        if (page < 1 || page > totalPages) return conn.reply(m.chat, `❀ Página no válida. Total: *${totalPages}*`, m)

        let message = `*❀ Nombre: \`<${bestMatch}>\`*\n\n`
        message += `❏ Personajes » *\`${totalChars}\`*\n`
        message += `♡ Reclamados » *\`${claimedCount}/${totalChars} (${percentage}%)\`*\n`
        message += `❏ Lista de personajes:​​\n\n`

        const listSlice = animeChars
            .sort((a, b) => parseInt(b.value) - parseInt(a.value)) // Ordenar por valor (value)
            .slice(startIndex, endIndex)

        for (const char of listSlice) {
            let status = 'Libre.'
            if (char.user) {
                try {
                    let name = await conn.getName(char.user)
                    status = `Reclamado por ${name}`
                } catch {
                    status = `Reclamado por @${char.user.split('@')[0]}`
                }
            }
            
            // Aquí usamos char.value en lugar de char.id
            message += `» *${char.name}* (${char.value}) • ${status}\n`
        }

        message += `\n> ⌦ _Pagina *${page}* de *${totalPages}*_`

        await conn.reply(m.chat, message, m, { mentions: claimedChars.map(c => c.user) })

    } catch (error) {
        console.error(error)
        await conn.reply(m.chat, `✘ Error crítico: ${error.message}`, m)
    }
}

handler.help = ['ainfo <serie>']
handler.tags = ['gacha']
handler.command = ['ainfo', 'series']
handler.group = true

export default handler