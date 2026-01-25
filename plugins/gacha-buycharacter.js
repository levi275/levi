import fs from 'fs'
import { loadVentas, saveVentas } from '../lib/gacha-group.js'

const charPath = './src/database/characters.json'

let handler = async (m, { args }) => {
if (!args[0]) return m.reply('✘ Usa el número del personaje a comprar.')
let ventas = await loadVentas()
let personajes = JSON.parse(fs.readFileSync(charPath, 'utf-8'))
let ventasGrupo = ventas.filter(v => v.groupId === m.chat)
let index = parseInt(args[0]) - 1
if (!ventasGrupo[index]) return m.reply('✘ Personaje inválido.')
let venta = ventasGrupo[index]
if (venta.vendedor === m.sender) return m.reply('✘ No puedes comprarte a ti mismo.')
let comprador = global.db.data.users[m.sender]
if (!comprador) return m.reply('✘ No estás registrado.')
let precio = venta.precio || 0
if ((comprador.coin || 0) < precio) return m.reply(`✘ No tienes suficiente dinero.\nNecesitas *¥${precio.toLocaleString()} ${m.moneda}*`)
let vendedor = global.db.data.users[venta.vendedor]
if (!vendedor) vendedor = global.db.data.users[venta.vendedor] = { coin: 0 }
comprador.coin -= precio
vendedor.coin = (vendedor.coin || 0) + precio
ventas = ventas.filter(v => v !== venta)
await saveVentas(ventas)
await global.db.write()
m.reply(`✔️ Compra exitosa\n\n🧍 Tú pagaste: *¥${precio.toLocaleString()} ${m.moneda}*\n👤 Vendedor recibió: *¥${precio.toLocaleString()} ${m.moneda}*\n✨ personaje obtenido: *${venta.name}*`)
}

handler.help = ['buywaifu <numero>']
handler.tags = ['waifus']
handler.command = ['buywaifu','comprarwaifu','buy']
handler.group = true
handler.register = true

export default handler
