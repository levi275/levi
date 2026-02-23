import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

const ILOVEIMG_URL = 'https://www.iloveimg.com/upscale-image'
const DEFAULT_SERVERS = [
  'api1g', 'api2g', 'api3g', 'api8g', 'api9g', 'api10g', 'api11g',
  'api12g', 'api13g', 'api14g', 'api15g', 'api16g', 'api17g',
  'api18g', 'api19g', 'api20g', 'api21g', 'api22g', 'api24g', 'api25g',
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const unique = (arr) => [...new Set((arr || []).filter(Boolean))]

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const findFirst = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

const parseConfigObject = (html) => {
  const configLiteral = findFirst(html, [
    /var\s+ilovepdfConfig\s*=\s*(\{[\s\S]*?\});/,
    /window\.ilovepdfConfig\s*=\s*(\{[\s\S]*?\});/,
  ])

  if (!configLiteral) return null

  try {
    return JSON.parse(configLiteral)
  } catch {
    try {
      // Página controlada por el proveedor, útil cuando no viene como JSON estricto
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${configLiteral});`)()
    } catch {
      return null
    }
  }
}

async function getIloveimgSession() {
  const { data: html } = await axios.get(ILOVEIMG_URL, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    },
    timeout: 25000,
  })

  const config = parseConfigObject(html)

  const token =
    config?.token ||
    findFirst(html, [
      /ilovepdfConfig\.token\s*=\s*['"]([^'"]+)['"]/, 
      /"token"\s*:\s*"([^"]+)"/,
      /(ey[a-zA-Z0-9?%\-_/]+)/,
    ])

  const taskId =
    config?.taskId ||
    findFirst(html, [
      /ilovepdfConfig\.taskId\s*=\s*['"]([^'"]+)['"]/, 
      /"taskId"\s*:\s*"([^"]+)"/,
      /taskId\s*[:=]\s*['"]([^'"]+)['"]/, 
    ])

  const csrf =
    findFirst(html, [
      /<meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/i,
      /csrf-token"\s+content="([^"]+)"/i,
    ]) || null

  const servers = unique([...(Array.isArray(config?.servers) ? config.servers : []), ...DEFAULT_SERVERS])

  if (!token) throw new Error('Token no encontrado en iLoveIMG.')
  if (!taskId) throw new Error('Task ID no encontrado en iLoveIMG.')
  if (!servers.length) throw new Error('No hay servidores disponibles de iLoveIMG.')

  return { token, taskId, csrf, servers }
}

function buildClient(server, token, csrf) {
  return axios.create({
    baseURL: `https://${server}.iloveimg.com`,
    timeout: 30000,
    headers: {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${token}`,
      Origin: 'https://www.iloveimg.com',
      Referer: 'https://www.iloveimg.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      ...(csrf ? { 'x-csrf-token': csrf, Cookie: `_csrf=${csrf}` } : {}),
    },
    validateStatus: () => true,
  })
}

async function uploadFile(client, taskId, fileBuffer, fileName = 'image.jpg') {
  const fileType = await fileTypeFromBuffer(fileBuffer)
  if (!fileType || !fileType.mime.startsWith('image/')) {
    throw new Error('El archivo enviado no es una imagen válida.')
  }

  const form = new FormData()
  form.append('name', fileName)
  form.append('chunk', '0')
  form.append('chunks', '1')
  form.append('task', taskId)
  form.append('preview', '1')
  form.append('pdfinfo', '0')
  form.append('pdfforms', '0')
  form.append('pdfresetforms', '0')
  form.append('v', 'web.0')
  form.append('file', fileBuffer, { filename: fileName, contentType: fileType.mime })

  const res = await client.post('/v1/upload', form, { headers: { ...form.getHeaders() } })
  if (res.status < 200 || res.status >= 300 || !res.data?.server_filename) {
    throw new Error(`Upload falló (${res.status}): ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`)
  }

  return res.data.server_filename
}

async function triggerUpscale(client, taskId, serverFilename, scale = 2) {
  const form = new FormData()
  form.append('task', taskId)
  form.append('server_filename', serverFilename)
  form.append('scale', String(scale))

  const res = await client.post('/v1/upscale', form, {
    headers: { ...form.getHeaders() },
    responseType: 'arraybuffer',
  })

  const contentType = String(res.headers?.['content-type'] || '')

  if (res.status >= 200 && res.status < 300 && contentType.startsWith('image/')) {
    return Buffer.from(res.data)
  }

  if (res.status < 200 || res.status >= 300) {
    const detail = Buffer.isBuffer(res.data) ? res.data.toString('utf-8') : JSON.stringify(res.data)
    throw new Error(`Upscale falló (${res.status}): ${detail}`)
  }

  return null
}

async function downloadWithPolling(client, taskId, attempts = 12) {
  let lastErr = 'Sin detalle'

  for (let i = 1; i <= attempts; i += 1) {
    const res = await client.get(`/v1/download/${taskId}`, { responseType: 'arraybuffer' })
    const contentType = String(res.headers?.['content-type'] || '')

    if (res.status >= 200 && res.status < 300) {
      const buffer = Buffer.from(res.data)
      const outType = await fileTypeFromBuffer(buffer)
      if (contentType.startsWith('image/') || outType?.mime?.startsWith('image/')) return buffer
      lastErr = `Respuesta no imagen (${contentType || 'sin content-type'})`
    } else {
      const detail = Buffer.isBuffer(res.data) ? res.data.toString('utf-8') : JSON.stringify(res.data)
      lastErr = `HTTP ${res.status}: ${detail}`
    }

    await sleep(1200 * i)
  }

  throw new Error(`No se pudo descargar el resultado final. ${lastErr}`)
}

async function upscaleViaIloveimg(fileBuffer, fileName, scale) {
  const session = await getIloveimgSession()

  const serversPool = unique([pickRandom(session.servers), ...session.servers]).slice(0, 6)
  let lastError = null

  for (const server of serversPool) {
    try {
      const client = buildClient(server, session.token, session.csrf)
      const serverFilename = await uploadFile(client, session.taskId, fileBuffer, fileName)
      const maybeImage = await triggerUpscale(client, session.taskId, serverFilename, scale)
      if (maybeImage) return maybeImage
      return await downloadWithPolling(client, session.taskId, 12)
    } catch (error) {
      lastError = error
    }
  }
}

  throw new Error(`No fue posible procesar en iLoveIMG: ${lastError?.message || 'error desconocido'}`)
}

const parseScale = (text) => {
  const value = Number((text || '').trim())
  return value === 4 ? 4 : 2
}

const handler = async (m, { conn, text }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''

  if (!/image\/(png|jpe?g|webp)/i.test(mime)) {
    return conn.reply(m.chat, '❌ Responde a una imagen válida (png, jpg o webp).', m)
  }

  await m.react('⏳')

  try {
    const media = await q.download()
    if (!media) throw new Error('No se pudo descargar la imagen.')

    const scale = parseScale(text)
    await conn.reply(m.chat, `✨ *Mejorando imagen con iLoveIMG (${scale}x)...*`, m)

    const output = await upscaleViaIloveimg(media, 'image.jpg', scale)

    await conn.sendMessage(
      m.chat,
      {
        image: output,
        caption: `✅ *Imagen mejorada con éxito (${scale}x)*\n🛠️ Proveedor: *iLoveIMG*`,
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
