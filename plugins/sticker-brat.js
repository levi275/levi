import Jimp from 'jimp'
import { sticker } from '../lib/sticker.js'

const FINAL_SIZE = 512
const WORK_SIZE = 1024
const MAX_TEXT_LENGTH = 260
const BG_COLOR = '#F2F2F2'

const FONT_CANDIDATES = [
  Jimp.FONT_SANS_128_BLACK,
  Jimp.FONT_SANS_64_BLACK,
  Jimp.FONT_SANS_32_BLACK,
]

function normalizeText(text = '') {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH)
}

function tokenize(text = '') {
  return text.split(' ').map((word) => word.trim()).filter(Boolean)
}

function makeChunks(font, words = [], maxChunkWidth = 360) {
  const chunks = []
  let i = 0

  while (i < words.length) {
    const w1 = words[i]
    const w2 = words[i + 1]

    if (w2) {
      const joined = `${w1} ${w2}`
      if (Jimp.measureText(font, joined) <= maxChunkWidth) {
        chunks.push(joined)
        i += 2
        continue
      }
    }

    chunks.push(w1)
    i += 1
  }

  return chunks
}

function buildRows(chunks = []) {
  const rows = []
  let current = { left: '', right: '' }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    // Cada cierto patrón, forzamos palabra/frase centrada para imitar ejemplos.
    if (i > 0 && i % 7 === 4 && !current.left && !current.right) {
      rows.push({ center: chunk })
      continue
    }

    if (!current.left) {
      current.left = chunk
      continue
    }

    if (!current.right) {
      current.right = chunk
      rows.push(current)
      current = { left: '', right: '' }
    }
  }

  if (current.left || current.right) rows.push(current)
  return rows
}

async function chooseLayout(words = []) {
  for (const fontPath of FONT_CANDIDATES) {
    const font = await Jimp.loadFont(fontPath)
    const chunks = makeChunks(font, words, 390)
    const rows = buildRows(chunks)

    const lineHeight = Jimp.measureTextHeight(font, 'Ay', WORK_SIZE) + 26
    const topPad = 70
    const bottomPad = 60
    const contentHeight = rows.length * lineHeight

    if (contentHeight <= WORK_SIZE - topPad - bottomPad) {
      return { font, rows, lineHeight, topPad }
    }
  }

  const fallbackFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
  const fallbackRows = buildRows(makeChunks(fallbackFont, words, 370))
  const fallbackLineHeight = Jimp.measureTextHeight(fallbackFont, 'Ay', WORK_SIZE) + 20
  return { font: fallbackFont, rows: fallbackRows.slice(0, 18), lineHeight: fallbackLineHeight, topPad: 50 }
}

async function renderBratImage(text = '') {
  const cleanText = normalizeText(text)
  if (!cleanText) throw new Error('Texto vacío para generar sticker.')

  const words = tokenize(cleanText)
  if (!words.length) throw new Error('No se encontraron palabras para renderizar.')

  const { font, rows, lineHeight, topPad } = await chooseLayout(words)

  const image = new Jimp(WORK_SIZE, WORK_SIZE, BG_COLOR)
  const shadow = new Jimp(WORK_SIZE, WORK_SIZE, 0x00000000)
  const textLayer = new Jimp(WORK_SIZE, WORK_SIZE, 0x00000000)

  const leftX = 70
  const rightX = 590
  const centerBoxX = 190
  const centerBoxW = 640

  const contentHeight = rows.length * lineHeight
  let y = Math.max(topPad, Math.floor((WORK_SIZE - contentHeight) / 2))

  for (const row of rows) {
    if (row.center) {
      shadow.print(
        font,
        centerBoxX + 6,
        y + 6,
        {
          text: row.center,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP,
        },
        centerBoxW,
        lineHeight,
      )

      textLayer.print(
        font,
        centerBoxX,
        y,
        {
          text: row.center,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP,
        },
        centerBoxW,
        lineHeight,
      )
    } else {
      if (row.left) {
        shadow.print(font, leftX + 6, y + 6, row.left)
        textLayer.print(font, leftX, y, row.left)
      }

      if (row.right) {
        shadow.print(font, rightX + 6, y + 6, row.right)
        textLayer.print(font, rightX, y, row.right)
      }
    }

    y += lineHeight
  }

  // Difuminado suave estilo ejemplo
  shadow.blur(3).opacity(0.25)
  textLayer.blur(1)

  image.composite(shadow, 0, 0)
  image.composite(textLayer, 0, 0)

  // Reducción para suavizar bordes y acercar estética del template compartido.
  image.resize(FINAL_SIZE, FINAL_SIZE, Jimp.RESIZE_BILINEAR)

  return image.getBufferAsync(Jimp.MIME_PNG)
}

async function makeBratSticker(text, packname, author) {
  const pngBuffer = await renderBratImage(text)
  const result = await sticker(pngBuffer, false, packname, author)

  if (!result) throw new Error('No se pudo renderizar el sticker.')
  return result
}

let handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.sendMessage(
      m.chat,
      { text: `${emoji} Por favor ingresa el texto para hacer un sticker brat.` },
      { quoted: m },
    )
  }

  try {
    await m.react?.('🕒')

    const userId = m.sender
    const packstickers = global.db.data.users[userId] || {}
    const texto1 = packstickers.text1 || global.packsticker
    const texto2 = packstickers.text2 || global.packsticker2

    const stiker = await makeBratSticker(text, texto1, texto2)
    await conn.sendFile(m.chat, stiker, 'brat.webp', '', m)
    await m.react?.('✅')
  } catch (error) {
    console.error('BRAT_STICKER_ERROR:', error)
    await m.react?.('✖️')
    return conn.sendMessage(
      m.chat,
      { text: `${msm} Ocurrió un error al generar el sticker brat.` },
      { quoted: m },
    )
  }
}

handler.command = ['brat']
handler.tags = ['sticker']
handler.help = ['brat *<texto>*']

export default handler
