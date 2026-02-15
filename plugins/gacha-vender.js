import { promises as fs } from 'fs';
import {
  loadVentas,
  saveVentas,
  addOrUpdateVenta
} from '../lib/gacha-group.js';

const charactersFile = './src/database/characters.json';

async function loadCharacters() {
  const data = await fs.readFile(charactersFile, 'utf-8');
  return JSON.parse(data);
}
async function saveCharacters(characters) {
  await fs.writeFile(charactersFile, JSON.stringify(characters, null, 2), 'utf-8');
}

let handler = async (m, { args, conn, participants }) => {
  let userId = m.sender;
  if (userId.endsWith('@lid') && m.isGroup) {
    const pInfo = participants.find(p => p.lid === userId);
    if (pInfo && pInfo.id) userId = pInfo.id;
  }

  const groupId = m.chat;
  const texto = args.join(' ').trim();

  let personaje = null;
  let precio = null;

  if (m.quoted?.text) {
    const idMatch = m.quoted.text.match(/🆔.*?\*(\d+)\*/i);
    if (!idMatch) return m.reply('✧ No se pudo encontrar el ID del personaje citado.');
    const id = idMatch[1].trim();
    const characters = await loadCharacters();
    personaje = characters.find(c => c.id === id);
    precio = parseInt(args[0]);
  } else {
    const precioDetectado = args.find(a => !isNaN(a));
    if (!precioDetectado) {
      return m.reply('✧ Ingresa un precio válido.\n> Ejemplo: *#vender Miku Nakano 40000*');
    }

    precio = parseInt(precioDetectado);
    if (isNaN(precio) || precio < 1) {
      return m.reply('✧ El precio debe ser un número válido mayor que 0.');
    }

    const nombre = args.filter(a => a !== precioDetectado).join(' ').toLowerCase();
    const characters = await loadCharacters();
    personaje = characters.find(c => c.name.toLowerCase() === nombre);

    if (!personaje) return m.reply(`✧ Personaje *"${nombre}"* no encontrado.`);
  }

  // Validación: el usuario debe poseer el personaje en este grupo
  // Comprobamos en harem.json si existe un claim en este grupo por user
  const haremRaw = await fs.readFile('./src/database/harem.json', 'utf-8').then(r => JSON.parse(r)).catch(() => []);
  const claim = haremRaw.find(e => e.groupId === groupId && e.characterId === personaje.id && e.userId === userId);
  if (!claim) return m.reply('✧ Esta waifu no te pertenece en este grupo.');

  const ventas = await loadVentas();

  // marcar en characters solo como meta-info (no afecta la pertenencia por grupo)
  const chars = await loadCharacters();
  const i = chars.findIndex(x => x.id === personaje.id);
  if (i === -1) return m.reply('✧ Error inesperado: personaje no encontrado en la base de datos.');

  chars[i].enVenta = true;
  chars[i].precioVenta = precio;

  const existing = ventas.find(v => v.groupId === groupId && v.id === personaje.id);
  if (existing) {
    existing.precio = precio;
    await saveCharacters(chars);
    await saveVentas(ventas);
    return m.reply(`✿ El personaje *${personaje.name}* ya estaba en venta en este grupo.\n› Se actualizó su precio a *¥${precio.toLocaleString()} ${m.moneda}*.`);
  }

  const ventaObj = {
    id: personaje.id,
    name: personaje.name,
    precio: precio,
    vendedor: userId,
    fecha: Date.now(),
    groupId
  };

  addOrUpdateVenta(ventas, groupId, ventaObj);
  await saveCharacters(chars);
  await saveVentas(ventas);

  m.reply(`✿ Has puesto en venta a *${personaje.name}* por *¥${precio.toLocaleString()} ${m.moneda}* en este grupo.`);
};

handler.help = ['venderwaifu'];
handler.tags = ['waifus'];
handler.command = ['vender', 'sell'];
handler.group = true;
handler.register = true;

export default handler;