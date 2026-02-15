import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters.json'
const CACHE_TTL_MS = 30 * 1000

let cache = {
  data: null,
  loadedAt: 0
}

function normalizeCharacterId(id) {
  return String(id ?? '').trim()
}

function normalizeCharacter(character) {
  if (!character || typeof character !== 'object') return character
  return {
    ...character,
    id: normalizeCharacterId(character.id),
    img: Array.isArray(character.img) ? character.img.filter(Boolean) : []
  }
}

async function loadCharacters({ force = false } = {}) {
  const now = Date.now()
  if (!force && cache.data && (now - cache.loadedAt) < CACHE_TTL_MS) {
    return cache.data
  }

  const raw = await fs.readFile(charactersFilePath, 'utf-8')
  const parsed = JSON.parse(raw)
  const normalized = Array.isArray(parsed) ? parsed.map(normalizeCharacter) : []

  cache = {
    data: normalized,
    loadedAt: now
  }

  return normalized
}

async function saveCharacters(characters) {
  const normalized = (Array.isArray(characters) ? characters : []).map(normalizeCharacter)
  await fs.writeFile(charactersFilePath, JSON.stringify(normalized, null, 2), 'utf-8')
  cache = {
    data: normalized,
    loadedAt: Date.now()
  }
}

function findCharacterById(characters, id) {
  const key = normalizeCharacterId(id)
  return characters.find(c => normalizeCharacterId(c.id) === key) || null
}

function findCharacterByName(characters, name) {
  const target = String(name || '').trim().toLowerCase()
  if (!target) return null
  return characters.find(c => String(c.name || '').trim().toLowerCase() === target) || null
}

function extractCharacterIdFromText(text = '') {
  if (!text) return null

  const patterns = [
    /🅸🅳\s*[:：]\s*([0-9]+)/i,
    /\bID\s*[:：#-]?\s*([0-9]+)/i,
    /\*([0-9]{1,6})\*/
  ]

  for (const pattern of patterns) {
    const match = String(text).match(pattern)
    if (match?.[1]) return normalizeCharacterId(match[1])
  }

  return null
}

export {
  loadCharacters,
  saveCharacters,
  normalizeCharacterId,
  findCharacterById,
  findCharacterByName,
  extractCharacterIdFromText
}
