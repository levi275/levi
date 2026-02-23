import Jimp from 'jimp'
import { sticker } from '../lib/sticker.js'

const CANVAS_SIZE = 512
const MAX_TEXT_LENGTH = 180

function normalizeText(text = '') {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_TEXT_LENGTH)
}

function splitWords(text = '', perLine = 18) {
  const words = text.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= perLine) {
      current = candidate
      continue
    }

    if (current) lines.push(current)

    if (word.length > perLine) {
      const chunks = word.match(new RegExp(`.{1,${perLine}}`, 'g')) || [word]
      lines.push(...chunks.slice(0, -1))
      current = chunks[chunks.length - 1]
    } else {
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 8)
}

async function renderBratImage(text = '') {
  const cleanText = normalizeText(text)
  if (!cleanText) throw new Error('Texto vacío para generar sticker.')

  const image = new Jimp(CANVAS_SIZE, CANVAS_SIZE, '#FFFFFF')
  const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)

  const lines = splitWords(cleanText, 17)
  const lineHeight = lines.length > 5 ? 56 : 66
  const blockHeight = lines.length * lineHeight
  const startY = Math.max(14, Math.floor((CANVAS_SIZE - blockHeight) / 2))

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight
    image.print(
      font,
      22,
      y,
      {
        text: lines[i],
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      CANVAS_SIZE - 44,
      lineHeight,
    )
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
