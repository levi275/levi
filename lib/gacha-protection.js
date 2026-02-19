export const PROTECTION_DURATIONS = {
  '3d': { ms: 3 * 24 * 60 * 60 * 1000, label: '3 días' },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, label: '7 días' },
  '15d': { ms: 15 * 24 * 60 * 60 * 1000, label: '15 días' },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, label: '30 días' }
}

const WALLET_BRACKETS = [
  { max: 10_000, price: 1_200 },
  { max: 50_000, price: 3_500 },
  { max: 150_000, price: 9_000 },
  { max: 500_000, price: 18_000 },
  { max: Infinity, price: 32_000 }
]

const DURATION_MULTIPLIER = {
  '3d': 1,
  '7d': 1.8,
  '15d': 3.2,
  '30d': 5.8
}

export function getBaseProtectionPrice(userCoin = 0) {
  const bracket = WALLET_BRACKETS.find(tier => userCoin < tier.max) || WALLET_BRACKETS[WALLET_BRACKETS.length - 1]
  return bracket.price
}

export function calculateProtectionCost({ userCoin = 0, duration = '3d', quantity = 1 }) {
  const safeQuantity = Math.max(1, Number(quantity) || 1)
  const basePrice = getBaseProtectionPrice(userCoin)
  const durationMultiplier = DURATION_MULTIPLIER[duration] || 1

  let total = Math.ceil(basePrice * durationMultiplier * safeQuantity)

  // Descuento leve para lotes grandes
  if (safeQuantity >= 5) total = Math.ceil(total * 0.92)
  if (safeQuantity >= 12) total = Math.ceil(total * 0.88)

  return total
}

export function isProtectionActive(entry) {
  if (!entry?.protection?.protected) return false
  const expiresAt = Number(entry?.protection?.expiresAt || 0)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    entry.protection.protected = false
    return false
  }
  return true
}

export function formatProtectionDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return 'Fecha inválida'
  }
}