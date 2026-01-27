import fs from 'fs'
import { loadVentas, saveVentas } from '../lib/gacha-group.js'

const charPath = './src/database/characters.json'

let handler = async (m, { args }) => {
if (!args[0]) return m.reply('🌸 *Uso correcto:*\n`buywaifu <número>`')

let ventas = await loadVentas()
let personajes = JSON.parse(fs.readFileSync(charPath, 'utf-8'))

let ventasGrupo = ventas.filter(v => v.groupId === m.chat)

let index = Number(args[0]) - 1
if (isNaN(index) || !ventasGrupo[index]) return m.reply('❌ *Ese personaje no existe*')

let venta = ventasGrupo[index]

if (venta.vendedor === m.sender) return m.reply('😅 *No puedes comprarte a ti mismo*')

let comprador = global.db.data.users[m.sender]
if (!comprador) return m.reply('❌ *No estás registrado en la base de datos*')

let precio = venta.precio || 0
if ((comprador.coin || 0) < precio) return m.reply(`💸 *Dinero insuficiente*\nNecesitas *¥${precio.toLocaleString()} ${m.moneda}*`)

let vendedor = global.db.data.users[venta.vendedor] || { coin: 0 }

comprador.coin -= precio
vendedor.coin = (vendedor.coin || 0) + precio

global.db.data.users[venta.vendedor] = vendedor

ventas = ventas.filter(v => v !== venta)
await saveVentas(ventas)
await global.db.write()

m.reply(
'✨ *COMPRA EXITOSA* ✨\n\n' +
`🧍 *Comprador:* Tú\n` +
`💰 *Pagaste:* ¥${precio.toLocaleString()} ${m.moneda}\n` +
`👤 *Vendedor recibió:* ¥${precio.toLocaleString()} ${m.moneda}\n` +
`💖 *Personaje obtenido:* ${venta.name}`
)
}

handler.help = ['buywaifu <número>']
handler.tags = ['waifus']
handler.command = /^(buywaifu|comprarwaifu|buy)$/i
handler.group = true
handler.register = true

export default handler
