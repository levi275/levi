import fs from 'fs'
import { loadVentas, saveVentas } from '../lib/gacha-group.js'

const charPath = './src/database/characters.json'

let handler = async (m, { args }) => {
if (!args[0]) return m.reply('🌸 *Uso correcto:*\n`buywaifu <número>`')

let ventas = await loadVentas()
let personajes = JSON.parse(fs.readFileSync(charPath, 'utf-8'))
let ventasGrupo = ventas.filter(v => v.groupId === m.chat)

let index = Number(args[0]) - 1
if (isNaN(index) || index < 0) return m.reply('❌ Número inválido.')

if (!ventasGrupo[index]) return m.reply('❌ Ese personaje no está en venta.')

let venta = ventasGrupo[index]

if (venta.vendedor === m.sender) return m.reply('😅 No puedes comprarte a ti mismo.')

let comprador = global.db.data.users[m.sender]
if (!comprador) return m.reply('⚠️ No estás registrado en la base de datos.')

let precio = Number(venta.precio) || 0
if ((comprador.coin || 0) < precio) return m.reply(
`💸 *Dinero insuficiente*\nNecesitas: *¥${precio.toLocaleString()} ${m.moneda}*`
)

let vendedor = global.db.data.users[venta.vendedor]
if (!vendedor) global.db.data.users[venta.vendedor] = { coin: 0 }

comprador.coin -= precio
vendedor.coin = (vendedor.coin || 0) + precio

ventas = ventas.filter(v => v !== venta)
await saveVentas(ventas)
await global.db.write()

m.reply(
`✨ *COMPRA REALIZADA CON ÉXITO* ✨

🧾 Personaje: *${venta.name}*
💰 Precio: *¥${precio.toLocaleString()} ${m.moneda}*
👤 Vendedor: recibió su pago
🎉 ¡Disfruta tu nuevo personaje!`
)
}

handler.help = ['buywaifu <número>']
handler.tags = ['waifus']
handler.command = ['buywaifu','comprarwaifu','buy']
handler.group = true
handler.register = true

export default handler
