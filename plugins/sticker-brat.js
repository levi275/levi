import Jimp from 'jimp'
import { sticker } from '../lib/sticker.js'

const CANVAS_SIZE = 512
const MAX_TEXT_LENGTH = 220
const PADDING_X = 26
const PADDING_Y = 24
const MIN_GAP = 14

const FONT_CANDIDATES = [
  Jimp.FONT_SANS_64_BLACK,
  Jimp.FONT_SANS_32_BLACK,
  Jimp.FONT_SANS_16_BLACK,
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

function lineWidth(font, words = [], minGap = MIN_GAP) {
  if (!words.length) return 0
  const wordsWidth = words.reduce((sum, word) => sum + Jimp.measureText(font, word), 0)
  const gapsWidth = Math.max(0, words.length - 1) * minGap
  return wordsWidth + gapsWidth
}

function wrapWords(font, words = [], maxWidth) {
  const lines = []
  let current = []

  for (const word of words) {
    if (!current.length) {
      current.push(word)
      continue
    }

    const tryLine = [...current, word]
    if (lineWidth(font, tryLine) <= maxWidth) {
      current = tryLine
    } else {
      lines.push(current)
      current = [word]
    }
  }

  if (current.length) lines.push(current)
  return lines
}

async function buildLayout(words = []) {
  const maxWidth = CANVAS_SIZE - PADDING_X * 2
  const maxHeight = CANVAS_SIZE - PADDING_Y * 2

  for (const fontPath of FONT_CANDIDATES) {
    const font = await Jimp.loadFont(fontPath)
    const lines = wrapWords(font, words, maxWidth)
    const lineHeight = Jimp.measureTextHeight(font, 'Ay', maxWidth) + 8
    const contentHeight = lines.length * lineHeight

    const fitsHeight = contentHeight <= maxHeight
    const fitsWidth = lines.every((line) => lineWidth(font, line) <= maxWidth)

    if (fitsHeight && fitsWidth) {
      return { font, lines, lineHeight }
    }
  }

  const fallbackFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK)
  const fallbackLines = wrapWords(fallbackFont, words, maxWidth)
  const fallbackLineHeight = Jimp.measureTextHeight(fallbackFont, 'Ay', maxWidth) + 6
  return { font: fallbackFont, lines: fallbackLines.slice(0, 14), lineHeight: fallbackLineHeight }
}

async function renderBratImage(text = '') {
  const cleanText = normalizeText(text)
  if (!cleanText) throw new Error('Texto vacío para generar sticker.')

  const words = tokenize(cleanText)
  if (!words.length) throw new Error('No se encontraron palabras para renderizar.')

  const image = new Jimp(CANVAS_SIZE, CANVAS_SIZE, '#FFFFFF')
  const { font, lines, lineHeight } = await buildLayout(words)

  const contentHeight = lines.length * lineHeight
  let y = Math.max(PADDING_Y, Math.floor((CANVAS_SIZE - contentHeight) / 2))

  const availableWidth = CANVAS_SIZE - PADDING_X * 2

  for (const line of lines) {
    const widths = line.map((word) => Jimp.measureText(font, word))
    const totalWordsWidth = widths.reduce((a, b) => a + b, 0)

    let gap = MIN_GAP
    if (line.length > 1) {
      const free = availableWidth - totalWordsWidth
      gap = Math.max(MIN_GAP, Math.floor(free / (line.length - 1)))
    }

    let x = PADDING_X
    for (let i = 0; i < line.length; i++) {
      image.print(font, x, y, line[i])
      x += widths[i] + gap
    }

    y += lineHeight
  }

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
