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
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function extractNamesFromList(text) {
  const names = []
  if (!text) return names

  const regex = /»\s*\*([^*]+)\*/g
  let m
  while ((m = regex.exec(text)) !== null) {
    names.push(m[1].trim())
  }

  if (!names.length) {
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(/^[»\-\>\s]*\*?([^(*\n\r]+)\*?\s*(?:\(|$)/)
      if (match && match[1]) names.push(match[1].trim())
    }
  }

  return [...new Set(names)]
}

let handler = async (m, { args, text }) => {
  try {
    const characters = await loadCharacters()
    if (!characters.length) return m.reply('✘ No hay personajes en la base de datos.')

    let targetJid = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
    let namesToGive = []

    if (args.length) {
      namesToGive = [args.join(' ').trim()]
    } else {
      let source = m.quoted?.text || text
      source = source.replace(/^\s*#?rwrestaurar/i, '').trim()
      namesToGive = extractNamesFromList(source)
    }

    if (!namesToGive.length) {
      return m.reply('✘ Escribe un nombre o responde a una lista.')
    }

    const found = []
    const notFound = []

    for (const nm of namesToGive) {
      const n = normalize(nm)
      let ch = characters.find(c => normalize(c.name) === n || String(c.id) === n)
      if (!ch) ch = characters.find(c => normalize(c.name).includes(n))
      if (ch) found.push(ch)
      else notFound.push(nm)
    }

    if (!found.length) {
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
    m.reply('✘ Error en rwrestaurar:\n' + e.message)
  }
}

handler.help = ['rwrestaurar <nombre>']
handler.tags = ['waifus']
handler.command = ['rwrestaurar']

export default handler
