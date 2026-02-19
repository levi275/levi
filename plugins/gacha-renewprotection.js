import { loadHarem, saveHarem } from '../lib/gacha-group.js'
import { loadCharacters } from '../lib/gacha-characters.js'
import {
  PROTECTION_DURATIONS,
  calculateProtectionCost,
  formatProtectionDate,
  isProtectionActive
} from '../lib/gacha-protection.js'

const ALL_PATTERN = /^(all|todos|todo)$/i

let handler = async (m, { conn, args }) => {
  const userId = m.sender
  const groupId = m.chat
  const user = global.db.data.users[userId]
  const moneda = m.moneda || 'Coins'

  if (!user) return conn.reply(m.chat, '✘ Usuario no registrado.', m)

  if (args.length < 2) {
    return conn.reply(m.chat,
      `◢✿ *RENOVAR PROTECCIÓN* ✿◤\n\n` +
      `✧ Uso: *#renovarproteccion <duración> <personaje|all>*\n` +
      `✧ Duraciones: *3d | 7d | 15d | 30d*`, m)
  }

  const duration = String(args[0] || '').toLowerCase()
  const target = args.slice(1).join(' ').trim().toLowerCase()
  const durationData = PROTECTION_DURATIONS[duration]

  if (!durationData) {
    return conn.reply(m.chat, '✘ Duración no válida. Usa: *3d, 7d, 15d o 30d*.', m)
  }

  try {
    const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()])
    const characterMap = new Map(characters.map(c => [String(c.id), c]))

    const userChars = harem.filter(c => c.groupId === groupId && c.userId === userId)
    if (!userChars.length) return conn.reply(m.chat, '✘ No tienes personajes en este grupo.', m)

    const byAll = ALL_PATTERN.test(target)
    const selected = byAll
      ? userChars
      : userChars.filter(c => {
        const char = characterMap.get(String(c.characterId))
        return char?.name?.toLowerCase().includes(target)
      })

    if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en tu harem.', m)

    const renewable = selected.filter(isProtectionActive)
    if (!renewable.length) {
      return conn.reply(m.chat,
        '✘ Los personajes elegidos no tienen protección activa para renovar.\nUsa *#comprarproteccion* primero.', m)
    }

    const totalCost = calculateProtectionCost({
      userCoin: user.coin || 0,
      duration,
      quantity: renewable.length
    })

    if ((user.coin || 0) < totalCost) {
      return conn.reply(m.chat,
        `◢✿ *SALDO INSUFICIENTE* ✿◤\n\n` +
        `✧ Renovación: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
        `✧ Saldo: *¥${(user.coin || 0).toLocaleString()} ${moneda}*`, m)
    }

    const now = Date.now()
    let maxExpiry = 0

    for (const char of renewable) {
      const currentExpiry = Number(char?.protection?.expiresAt || 0)
      const baseTime = currentExpiry > now ? currentExpiry : now
      const newExpiry = baseTime + durationData.ms
      char.protection = {
        ...char.protection,
        protected: true,
        expiresAt: newExpiry,
        duration,
        renewedAt: now
      }
      if (newExpiry > maxExpiry) maxExpiry = newExpiry
    }

    user.coin -= totalCost
    await saveHarem(harem)

    return conn.reply(m.chat,
      `◢✿ *PROTECCIÓN RENOVADA* ✿◤\n\n` +
      `✧ Renovados: *${renewable.length} personaje(s)*\n` +
      `✧ Extensión: *${durationData.label}*\n` +
      `✧ Vencimiento más lejano: *${formatProtectionDate(maxExpiry)}*\n` +
      `✧ Costo: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
      `✧ Cartera: *¥${(user.coin || 0).toLocaleString()} ${moneda}*`, m)
  } catch (error) {
    console.error(error)
    return conn.reply(m.chat, `✘ Error al renovar protección: ${error.message}`, m)
  }
}

handler.help = ['renovarproteccion <duración> <personaje|all>']
handler.tags = ['gacha', 'economia']
handler.command = ['renovarproteccion', 'renewprotection', 'extenderproteccion']
handler.group = true
handler.register = true

export default handler
