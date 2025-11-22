import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters.json'
const claimMsgFile = './src/database/userClaimConfig.json'
const statusFilePath = './src/database/characterStatus.json'

export const cooldowns = {}

async function loadCharacters() {
    const data = await fs.readFile(charactersFilePath, 'utf-8')
    return JSON.parse(data)
}

async function loadStatus() {
    try {
        const data = await fs.readFile(statusFilePath, 'utf-8')
        return JSON.parse(data)
    } catch {
        await fs.writeFile(statusFilePath, JSON.stringify({}, null, 2))
        return {}
    }
}

async function saveStatus(status) {
    await fs.writeFile(statusFilePath, JSON.stringify(status, null, 2))
}

async function loadClaimMessages() {
    try {
        const data = await fs.readFile(claimMsgFile, 'utf-8')
        return JSON.parse(data)
    } catch {
        return {}
    }
}

async function getCustomClaimMessage(userId, username, characterName) {
    const messages = await loadClaimMessages()
    const template = messages[userId] || '✧ *$user* ha reclamado a *$character* ✦'
    return template.replace(/\$user/g, username).replace(/\$character/g, characterName)
}

let handler = async (m, { conn }) => {
    const userId = m.sender
    const now = Date.now()

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const left = cooldowns[userId] - now
        const minutes = Math.floor(left / 60000)
        const seconds = Math.floor((left % 60000) / 1000)
        return conn.reply(m.chat, `⏳ Debes esperar *${minutes}m ${seconds}s* antes de reclamar otra waifu.`, m)
    }

    if (!m.quoted || !m.quoted.text) {
        return conn.reply(m.chat, '《✧》Debes *citar un personaje válido* para reclamarlo.', m)
    }

    try {
        const characters = await loadCharacters()
        const status = await loadStatus()

        const match = m.quoted.text.match(/𝙄𝘿:\s*\*([^\*]+)\*/i)
        if (!match) return conn.reply(m.chat, '《✧》No se pudo detectar el ID del personaje.', m)

        const id = match[1].trim()
        const character = characters.find(c => String(c.id) === id)
        if (!character) return conn.reply(m.chat, '《✧》Personaje no encontrado.', m)

        const cid = String(character.id)
        if (!status[cid]) status[cid] = { user: null, protectedUntil: 0, expiresAt: 0 }

        if (status[cid].expiresAt < now) {
            return conn.reply(m.chat, `⌛ El personaje *${character.name}* expiró y ya no puede ser reclamado.`, m)
        }

        if (status[cid].user && status[cid].user !== userId) {
            if (now < status[cid].protectedUntil) {
                const remaining = Math.ceil((status[cid].protectedUntil - now) / 1000)
                const owner = status[cid].user.split('@')[0]
                return conn.reply(
                    m.chat,
                    `🛡️ El personaje *${character.name}* está siendo protegido por *@${owner}*.\n⏳ Tiempo restante: *${remaining} segundos*`,
                    m,
                    { mentions: [status[cid].user] }
                )
            }
        }

        status[cid].user = userId
        status[cid].protectedUntil = now + 20000
        status[cid].expiresAt = now + 40000

        await saveStatus(status)

        const username = await conn.getName(userId)
        const finalMessage = await getCustomClaimMessage(userId, username, character.name)

        await conn.reply(m.chat, finalMessage, m)

        cooldowns[userId] = now + 30 * 60 * 1000
    } catch (e) {
        conn.reply(m.chat, `✘ Error al reclamar waifu:\n${e.message}`, m)
    }
}

handler.help = ['claim']
handler.tags = ['waifus']
handler.command = ['claim', 'reclamar', 'c']
handler.group = true

export default handler
