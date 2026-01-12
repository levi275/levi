import { loadVentas, saveVentas, removeVenta, loadHarem, saveHarem, addOrUpdateClaim } from '../lib/gacha-group.js';

let handler = async (m, { conn, args, participants }) => {
  let rawUserId = m.sender;

  if (rawUserId.endsWith('@lid') && m.isGroup) {
    const pInfo = participants.find(p => p.lid === rawUserId);
    if (pInfo?.id) rawUserId = pInfo.id;
  }

  const userId = rawUserId;
  const user = global.db.data.users[userId];
  const groupId = m.chat;

  if (!args[0]) {
    return m.reply('✿ Usa: *#comprarwaifu <nombre del personaje>*');
  }

  const nombre = args.join(' ').trim().toLowerCase();

  const ventas = await loadVentas();
  const harem = await loadHarem();

  const venta = ventas.find(v => v.groupId === groupId && v.name.toLowerCase() === nombre);

  if (!venta) return m.reply('✘ Ese personaje no está en venta en este grupo.');
  if (venta.vendedor === userId) return m.reply('✘ No puedes comprar tu propia waifu.');

  const precio = Number(venta.precio || 0);

  if (user.coin < precio) {
    return m.reply(`✘ No tienes suficientes *${m.moneda}*. Necesitas *¥${precio.toLocaleString()} ${m.moneda}*.`);
  }

  user.coin -= precio;

  if (global.db.data.users[venta.vendedor]) {
    global.db.data.users[venta.vendedor].coin += precio;
  }

  removeVenta(ventas, groupId, venta.id);
  await saveVentas(ventas);

  addOrUpdateClaim(harem, groupId, userId, venta.id);
  await saveHarem(harem);

  let nombreComprador = await conn.getName(userId);
  let textoPrivado = `✿ Tu waifu *${venta.name}* fue comprada por *${nombreComprador}*.\nGanaste *¥${precio.toLocaleString()} ${m.moneda}*.`;

  await conn.sendMessage(venta.vendedor, { text: textoPrivado }, { quoted: m });

  m.reply(`✿ Has comprado a *${venta.name}* por *¥${precio.toLocaleString()} ${m.moneda}* exitosamente!\nAhora es parte de tu harem en este grupo.`);
};

handler.help = ['comprarwaifu <nombre>'];
handler.tags = ['waifus'];
handler.command = ['comprarwaifu', 'buycharacter', 'buychar', 'buyc'];
handler.group = true;
handler.register = true;

export default handler;
