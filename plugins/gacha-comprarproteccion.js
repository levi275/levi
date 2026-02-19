import { loadHarem, saveHarem } from '../lib/gacha-group.js'
import { loadCharacters } from '../lib/gacha-characters.js'
import {
  PROTECTION_DURATIONS,
  calculateProtectionCost,
  isProtectionActive,
  formatProtectionDate
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
      `◢✿ *PROTECCIÓN DE HAREM* ✿◤\n\n` +
      `✧ Uso: *#comprarproteccion <duración> <personaje|all>*\n` +
      `✧ Duraciones: *3d | 7d | 15d | 30d*\n\n` +
      `✦ Ejemplos:\n` +
      `- #comprarproteccion 7d all\n` +
      `- #comprarproteccion 15d miku`, m)
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
    let selected = byAll
      ? userChars
      : userChars.filter(c => {
        const char = characterMap.get(String(c.characterId))
        return char?.name?.toLowerCase().includes(target)
      })

    if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en tu harem.', m)

    const alreadyProtected = selected.filter(isProtectionActive)
    selected = selected.filter(c => !isProtectionActive(c))

    if (!selected.length) {
      return conn.reply(m.chat,
        `✘ Todos los personajes seleccionados ya tienen protección activa.\n` +
        `Usa *#renovarproteccion* para extenderla.`, m)
    }

    const totalCost = calculateProtectionCost({
      userCoin: user.coin || 0,
      duration,
      quantity: selected.length
    })

    if ((user.coin || 0) < totalCost) {
      return conn.reply(m.chat,
        `◢✿ *SALDO INSUFICIENTE* ✿◤\n\n` +
        `✧ Necesitas: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
        `✧ Tienes: *¥${(user.coin || 0).toLocaleString()} ${moneda}*`, m)
    }

    const expiresAt = Date.now() + durationData.ms
    for (const char of selected) {
      char.protection = {
        protected: true,
        expiresAt,
        duration,
        purchasedAt: Date.now()
      }
    }

    user.coin -= totalCost
    await saveHarem(harem)

    return conn.reply(m.chat,
      `◢✿ *PROTECCIÓN ACTIVADA* ✿◤\n\n` +
      `✧ Protegidos: *${selected.length} personaje(s)*\n` +
      `✧ Duración: *${durationData.label}*\n` +
      `✧ Expira: *${formatProtectionDate(expiresAt)}*\n` +
      `✧ Costo: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
      `✧ Cartera: *¥${(user.coin || 0).toLocaleString()} ${moneda}*` +
      `${alreadyProtected.length ? `\n\n⚠️ Ya protegidos (sin cobro): *${alreadyProtected.length}*` : ''}`,
      m)
  } catch (error) {
    console.error(error)
    return conn.reply(m.chat, `✘ Error al comprar protección: ${error.message}`, m)
  }
}

handler.help = ['comprarproteccion <duración> <personaje|all>']
handler.tags = ['gacha', 'economia']
handler.command = ['comprarproteccion', 'buyprotection', 'proteger']
handler.group = true
handler.register = true

export default handler