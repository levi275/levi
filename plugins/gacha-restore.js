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

function normalize(s = '') {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[\u200B-\u200D\u2060-\u2064]/g, '') // quitar caracteres invisibles
    .trim()
}

function getQuotedOrText(m, textParam) {
  // varios fallbacks para obtener el texto fuente (citado o del mensaje actual)
  const tryGet = (obj) => {
    if (!obj) return null
    if (typeof obj === 'string') return obj
    // formatos comunes de Baileys
    if (obj.text) return obj.text
    if (obj.caption) return obj.caption
    if (obj.contentText) return obj.contentText
    // nested message e.g. ephemeralMessage
    if (obj.message && typeof obj.message === 'object') {
      return tryGet(obj.message.extendedTextMessage?.text
        || obj.message.conversation
        || obj.message.extendedTextMessage?.text
        || obj.message?.imageMessage?.caption
        || obj.message?.videoMessage?.caption
        || obj.message?.buttonsMessage?.contentText
        || obj.message?.listMessage?.singleSelectReply?.selectedDisplayText
        || obj.message?.ephemeralMessage?.message)
    }
    return null
  }

  const quotedText = tryGet(m.quoted) || tryGet(m.quoted?.message) || tryGet(m.quoted?.message?.ephemeralMessage?.message)
  const directText = tryGet(m) || tryGet(m.message) || textParam
  const src = quotedText || directText || ''
  // limpiar caracteres invisibles que rompen regex
  return String(src).replace(/[\u200B-\u200D\u2060-\u2064]/g, '')
}

function extractNamesFromList(text) {
  if (!text) return []
  // normalizar saltos de línea para facilitar búsqueda, pero mantenemos '»' y '*' y '('
  const raw = String(text).replace(/\r/g, '')
  const names = new Set()

  // 1) Buscar patrones con » *Name* (..) o » *Name*
  const reStar = /[»›>\-•]\s*\*\s*([^*]+?)\s*\*/g
  let m
  while ((m = reStar.exec(raw)) !== null) {
    const nm = m[1].trim()
    if (nm) names.add(nm)
  }

  // 2) Buscar patrones » Name (number)  o - Name (..), sin asteriscos
  const reParen = /^[\s]*[»›>\-\•]?\s*([^\(\*\n]{3,}?)\s*(?:\(|$)/gm
  while ((m = reParen.exec(raw)) !== null) {
    const nm = (m[1] || '').trim()
    if (nm && nm.length > 1) names.add(nm)
  }

  // 3) Buscar todo lo que esté entre asteriscos si formato raro: *Name* (fallback)
  const reAnyStar = /\*\s*([^*]{3,}?)\s*\*/g
  while ((m = reAnyStar.exec(raw)) !== null) {
    const nm = m[1].trim()
    if (nm && nm.length > 1) names.add(nm)
  }

  // 4) Si no encontramos nada, intentar líneas que contengan paréntesis con números (Name) (fallback)
  if (names.size === 0) {
    const lines = raw.split('\n')
    for (const line of lines) {
      const match = line.match(/^.*?([A-Za-zÀ-ÿ0-9\.\- ']{3,}?)\s*\(\s*\d{2,6}\s*\).*/i)
      if (match && match[1]) names.add(match[1].trim())
    }
  }

  return Array.from(names)
}

let handler = async (m, { args, text }) => {
  try {
    const characters = await loadCharacters()
    if (!characters.length) return m.reply('✘ No hay personajes en la base de datos.')

    // destinatario: primero m.mentionedJid (si te refieres a "mencionando un mensaje del usuario"),
    // luego si se respondió a un mensaje usar el autor citado, finalmente el emisor del comando.
    let targetJid = (m.mentionedJid && m.mentionedJid.length) ? m.mentionedJid[0] : (m.quoted?.sender || m.sender)
    // obtener texto fuente robusto
    const sourceText = getQuotedOrText(m, text || args.join(' '))
    let namesToGive = []

    if (args && args.length) {
      // aceptar: nombres separados por comas, barras o newlines
      const combined = args.join(' ')
      const byComma = combined.split(/\s*[,\|\/]\s*/)
      if (byComma.length > 1) namesToGive = byComma.map(s => s.trim()).filter(Boolean)
      else namesToGive = extractNamesFromList(sourceText).length ? extractNamesFromList(sourceText) : [combined.trim()]
    } else {
      namesToGive = extractNamesFromList(sourceText)
    }

    if (!namesToGive || namesToGive.length === 0) {
      return m.reply('✘ Escribe un nombre, separalos por comas o responde a una lista que contenga los nombres.')
    }

    const found = []
    const notFound = []

    for (const nm of namesToGive) {
      const n = normalize(nm)
      let ch = characters.find(c => normalize(c.name) === n || String(c.id) === n)
      if (!ch) ch = characters.find(c => normalize(c.name).includes(n) || normalize(String(c.id)).includes(n))
      if (ch) found.push(ch)
      else notFound.push(nm)
    }

    if (!found.length) {
      // añadir debug opcional (comentar en producción)
      // console.log('rwrestaurar: no matches for', namesToGive, 'loaded chars count', characters.length)
      return m.reply('✘ No se encontró ningún personaje.')
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
handler.command = ['rwrestaurar']

export default handler