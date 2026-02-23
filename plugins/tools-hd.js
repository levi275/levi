import Jimp from 'jimp'

const MAX_INPUT_PIXELS = 18_000_000 // evita reventar RAM con imágenes enormes

const parseScaleFromText = (text) => {
  const n = Number((text || '').trim())
  if (n === 4) return 4
  return 2
}

const validateImageDimensions = (img) => {
  const pixels = img.bitmap.width * img.bitmap.height
  if (pixels > MAX_INPUT_PIXELS) {
    throw new Error('La imagen es demasiado grande para procesarla de forma segura.')
  }
}

const enhanceImageLocally = async (buffer, scale = 2) => {
  const image = await Jimp.read(buffer)
  validateImageDimensions(image)

  const nextWidth = Math.max(1, Math.floor(image.bitmap.width * scale))
  const nextHeight = Math.max(1, Math.floor(image.bitmap.height * scale))

  // Pipeline local (sin proveedores externos): upscale + limpieza + nitidez
  const output = image
    .clone()
    .resize(nextWidth, nextHeight, Jimp.RESIZE_BICUBIC)
    .normalize()
    .contrast(0.1)
    .quality(95)

  // Sharpen suave para recuperar detalles tras interpolación
  output.convolute([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ])

  return output.getBufferAsync(Jimp.MIME_JPEG)
}

const handler = async (m, { conn, text }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''

  if (!mime || !/image\/(png|jpe?g|webp)/i.test(mime)) {
    return conn.reply(m.chat, '❌ Responde a una imagen válida (png, jpg o webp).', m)
  }

  await m.react('⏳')

  try {
    const media = await q.download()
    if (!media) throw new Error('No se pudo descargar la imagen.')

    const scale = parseScaleFromText(text)
    await conn.reply(m.chat, `✨ *Mejorando imagen en HD (${scale}x local)...*`, m)

    const upscaledBuffer = await enhanceImageLocally(media, scale)

    await conn.sendMessage(
      m.chat,
      {
        image: upscaledBuffer,
        caption: `✅ *Imagen mejorada con éxito (${scale}x)*\n🛠️ Proveedor: *procesamiento local*`,
      },
      { quoted: m },
    )

    await m.react('✅')
  } catch (error) {
    console.error('[tools-hd] Error:', error)
    await m.react('❌')
    return conn.reply(
      m.chat,
      `❌ *Error al procesar la imagen:*\n\`\`\`${error?.message || 'Error desconocido'}\`\`\``,
      m,
    )
  }
}

handler.help = ['hd', 'upscale']
handler.tags = ['herramientas']
handler.command = ['hd', 'upscale', 'mejorarimagen']
handler.register = true
handler.limit = true

export default handler
