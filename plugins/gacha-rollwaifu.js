import { loadHarem, findClaim } from '../lib/gacha-group.js'
import { loadCharacters, normalizeCharacterId } from '../lib/gacha-characters.js'

export const cooldowns = {}

global.activeRolls = global.activeRolls || {}

function formatUrl(url) {
    if (!url) return url
    url = url.trim()

    if (url.includes('github.com') && url.includes('/blob/')) {
        url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
    }

    if (url.includes('github.com') && url.includes('?raw=true')) {
        url = url.replace('github.com', 'raw.githubusercontent.com').replace('?raw=true', '')
    }

    if (url.includes('raw.github.com')) {
        url = url.replace('raw.github.com', 'raw.githubusercontent.com')
    }

    return url
}

let handler = async (m, { conn }) => {
    const userId = m.sender
    const groupId = m.chat
    const now = Date.now()
    const key = `${groupId}:${userId}`

    for (const [rollKey, rollData] of Object.entries(global.activeRolls)) {
        if (!rollData?.time || now - rollData.time > 3 * 60 * 1000) delete global.activeRolls[rollKey]
    }

    if (cooldowns[key] && now < cooldowns[key]) {
        const remainingTime = Math.ceil((cooldowns[key] - now) / 1000)
        const minutes = Math.floor(remainingTime / 60)
        const seconds = remainingTime % 60
        return await conn.reply(m.chat, `( ⸝⸝･̆⤚･̆⸝⸝) ¡Debes esperar *${minutes} minutos y ${seconds} segundos* para volver a usar *#rollwaifu* en este grupo.`, m)
    }

    cooldowns[key] = now + 15 * 60 * 1000

    try {
        const characters = await loadCharacters()
        if (!characters.length) throw new Error('❀ No hay personajes disponibles para el gacha.')
        
        const randomCharacter = characters[Math.floor(Math.random() * characters.length)]
        randomCharacter.id = normalizeCharacterId(randomCharacter.id)
        
        const imageList = Array.isArray(randomCharacter.img) ? randomCharacter.img : []
        let randomImage = imageList[Math.floor(Math.random() * imageList.length)]
        if (!randomImage) throw new Error(`❀ El personaje ${randomCharacter.name} no tiene imágenes válidas.`)

        randomImage = formatUrl(randomImage)

        if (randomImage.match(/\.webp($|\?)/i)) {
            randomImage = `https://wsrv.nl/?url=${encodeURIComponent(randomImage)}&output=png`
        }

        const harem = await loadHarem()
        const claimedInGroup = findClaim(harem, groupId, randomCharacter.id)
        
        let ownerName = 'Nadie'
        if (claimedInGroup) {
            ownerName = await conn.getName(claimedInGroup.userId)
        }

        if (!claimedInGroup) {
            global.activeRolls[`${groupId}:${randomCharacter.id}`] = { user: userId, time: Date.now() }
        }

        const message = `
ㅤㅤ⏜⋮ㅤㅤ꒰ㅤ꒰ㅤㅤ𖹭⃞🎲⃞𖹭ㅤㅤ꒱ㅤ꒱ㅤㅤ⋮⏜
꒰ㅤ꒰͡ㅤ 🄽🅄🄴🅅🄾 🄿🄴🅁🅂🄾🄽🄰🄹🄴ㅤㅤ͡꒱ㅤ꒱

▓𓏴𓏴 ۪ ֹ 🄽꯭🄾꯭🄼꯭🄱꯭🅁꯭🄴 :
╰┈➤ ❝ ${randomCharacter.name} ❞

▓𓏴𓏴 ۪ ֹ 🅅꯭🄰꯭🄻꯭🄾꯭🅁 :
╰┈➤ 🪙 ${randomCharacter.value}

▓𓏴𓏴 ۪ ֹ 🄴꯭🅂꯭🅃꯭🄰꯭🄳꯭🄾 :
╰┈➤ ✨ ꯭${claimedInGroup ? '🚫 Ocupado' : '✅ Libre'}

▓𓏴𓏴 ۪ ֹ 🄳꯭🅄꯭🄴꯭🄽꯭̃🄾 :
╰┈➤ 👤 ${ownerName}

▓𓏴𓏴 ۪ ֹ 🄵꯭🅄꯭🄴꯭🄽꯭🅃꯭🄴 :
╰┈➤ 📖 ${randomCharacter.source}

┉͜┄͜─┈┉⃛┄─꒰֟፝͡ 🅸🅳: ${randomCharacter.id} ꒱─┄⃨┉┈─͡┄͡┉
ㅤㅤㅤㅤㅤㅤ© ᑲ᥆𝗍 𝗀ɑᥴ꯭hɑ 𝗌𝗒sł꯭ᥱꭑ꒱
`

        await conn.sendMessage(m.chat, {
            image: { url: randomImage },
            mimetype: "image/jpeg",
            caption: message
        }, { quoted: m })

    } catch (error) {
        delete cooldowns[key]
        console.error(error)
        await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m)
    }
}

handler.help = ['rw', 'rollwaifu']
handler.tags = ['gacha']
handler.command = ['rw', 'rollwaifu']
handler.group = true

export default handler