import { promises as fs } from 'fs'
import path from 'path'
import {
  loadHarem,
  saveHarem,
  bulkAddClaims
} from '../lib/gacha-group.js'

const charactersFilePath = path.join(process.cwd(), 'src', 'database', 'characters.json')

async function loadCharacters() {
  try {
    const raw = await fs.readFile(charactersFilePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function cleanWhitespaceAndControls(s = '') {
  // elimina zero-width, isolates, NBSP, caracteres de control y colapsa espacios
  return String(s || '')
    .replace(/[\u200B-\u200D\u2060-\u2064\u2066-\u2069]/g, '') // ZW & isolates
    .replace(/\u00A0/g, ' ') // NBSP -> space
    .replace(/[\t\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalize(s = '') {
  return cleanWhitespaceAndControls(String(s || ''))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^\p{L}\p{N}\s\-\.\,'’]/gu, '') // opcional: quitar emojis y símbolos no alfanuméricos (mantener letras, números y algunos signos)
    .trim()
}

function extractNamesFromList(text) {
  if (!text) return []
  const raw = String(text).replace(/\r/g, '')
  const names = new Set()

  // patrón 1: » *Name*  o - *Name*  (captura entre asteriscos)
  const reStar = /[»›>\-\•••·]\s*\*\s*([^*]{2,}?)\s*\*/g
  let m
  while ((m = reStar.exec(raw)) !== null) {
    const nm = m[1].trim()
    if (nm) names.add(cleanWhitespaceAndControls(nm))
  }

  // patrón 2: líneas con » Name (number) o - Name (number) sin asteriscos
  const reBullet = /^[\s]*[»›>\-\••·]?\s*([^\(\*\n]{2,}?)\s*(?:\(|$)/gm
  while ((m = reBullet.exec(raw)) !== null) {
    const nm = (m[1] || '').trim()
    if (nm) names.add(cleanWhitespaceAndControls(nm))
  }

  // patrón 3: cualquier *Name* (fallback)
  const reAnyStar = /\*\s*([^*]{2,}?)\s*\*/g
  while ((m = reAnyStar.exec(raw)) !== null) {
    const nm = m[1].trim()
    if (nm) names.add(cleanWhitespaceAndControls(nm))
  }

  // patrón 4: líneas con texto antes de paréntesis, fallback estricto
  if (names.size === 0) {
    const lines = raw.split('\n')
    for (const line of lines) {
      const match = line.match(/^.*?([A-Za-zÀ-ÿ0-9\.\- ']{2,}?)\s*\(\s*\d{2,6}\s*\).*/i)
      if (match && match[1]) names.add(cleanWhitespaceAndControls(match[1].trim()))
    }
  }

  // patrón 5: si sigue vacío, agregar líneas no vacías de longitud > 2 (muy fallback)
  if (names.size === 0) {
    for (const line of raw.split('\n')) {
      const t = cleanWhitespaceAndControls(line)
      if (t && t.length > 2 && !/^(#|✿|♡|⌦|Página|Página\s*\d+)/i.test(t)) names.add(t)
    }
  }

  return Array.from(names)
}

function robustMatchName(characters, candidate) {
  const n = normalize(candidate)
  if (!n) return null
  // Primero búsqueda exacta o id
  let ch = characters.find(c => normalize(c.name) === n || String(c.id) === n)
  if (ch) return ch
  // luego contains y startsWith
  ch = characters.find(c => normalize(c.name).includes(n) || n.includes(normalize(c.name)))
  if (ch) return ch
  ch = characters.find(c => normalize(c.name).startsWith(n) || normalize(c.name).split(' ').some(w => w === n))
  if (ch) return ch
  // intento por palabras: todas las palabras del candidato deben aparecer en el nombre del personaje
  const words = n.split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    ch = characters.find(c => {
      const nm = normalize(c.name)
      return words.every(w => nm.includes(w))
    })
    if (ch) return ch
  }
  return null
}

let handler = async (m, { args, text }) => {
  try {
    const characters = await loadCharacters()
    if (!characters.length) return m.reply('✘ No hay personajes en la base de datos.')

    // target: si se menciona un JID explícito, usarlo; si se responde a un mensaje, usar el autor citado; sino el emisor
    let targetJid = (m.mentionedJid && m.mentionedJid.length) ? m.mentionedJid[0] : (m.quoted?.sender || m.sender)

    // Fuente de texto: preferir texto citado, luego el texto del mensaje (m.text provisto por smsg), luego text/args
    const src = (m.quoted && (m.quoted.text || m.quoted.message?.extendedTextMessage?.text || m.quoted.message?.conversation))
      || m.text || text || args.join(' ')
    const sourceText = String(src || '')

    let namesToGive = []

    if (args && args.length) {
      const combined = args.join(' ').trim()
      // si hay comas/barras separadoras
      const bySplit = combined.split(/\s*[,\|\/]\s*/).map(s => s.trim()).filter(Boolean)
      if (bySplit.length > 1) namesToGive = bySplit
      else {
        // intentar extraer de sourceText si es más largo
        const ext = extractNamesFromList(sourceText)
        namesToGive = ext.length ? ext : [combined]
      }
    } else {
      namesToGive = extractNamesFromList(sourceText)
    }

    if (!namesToGive || namesToGive.length === 0) {
      // debug: mostrar lo que se recibió para ayudar a diagnosticar
      return m.reply('✘ Escribe un nombre o responde a una lista. (No se extrajeron nombres)\n\nDEBUG: texto analizado:\n' + (sourceText.slice(0, 800) || '[vacío]'))
    }

    const found = []
    const notFound = []

    for (const nm of namesToGive) {
      const ch = robustMatchName(characters, nm)
      if (ch) found.push(ch)
      else notFound.push(nm)
    }

    if (!found.length) {
      // debug para entender por qué no hubo coincidencias
      return m.reply('✘ No se encontró ningún personaje.\n\nDEBUG: textos extraídos:\n' + JSON.stringify(namesToGive.slice(0, 50), null, 2) + '\n\n(Total personajes en DB: ' + characters.length + ')')
    }

    const harem = await loadHarem()
    const ids = found.map(c => c.id)
    const added = bulkAddClaims(harem, m.chat, targetJid, ids)
    await saveHarem(harem)

    let msg = `✔ Se asignaron ${added} personaje(s):\n\n`
    msg += found.map(c => `» *${c.name}*`).join('\n')

    if (notFound.length) msg += `\n\n✘ No encontrados: ${notFound.join(', ')}`

    await m.reply(msg)

  } catch (e) {
    console.error(e)
    m.reply('✘ Error en rwrestaurar:\n' + (e?.message || String(e)))
  }
}

handler.help = ['rwrestaurar <nombre>']
handler.tags = ['waifus']
handler.command = ['rwrestaurar', 'rwrestore', 'restorewaifu']

export default handler