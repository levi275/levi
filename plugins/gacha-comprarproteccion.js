import { loadHarem, saveHarem } from '../lib/gacha-group.js';
import { loadCharacters, findCharacterById } from '../lib/gacha-characters.js';

function calculatePrice(userCoin) {
  if (userCoin < 5000) return 500;
  if (userCoin < 25000) return 1500;
  if (userCoin < 100000) return 4000;
  if (userCoin < 500000) return 12000;
  return 25000;
}

const durations = {
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '15d': 15 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
};

let handler = async (m, { conn, args, text }) => {
  const userId = m.sender;
  const groupId = m.chat;
  const user = global.db.data.users[userId];

  if (!user) return conn.reply(m.chat, `✘ Usuario no registrado.`, m);

  if (args.length < 2) {
    return conn.reply(m.chat,
      `🔒 *Uso: #comprarproteccion <duración> <personaje|all>*\n\n` +
      `⏱️ *Duraciones:* 3d | 7d | 15d | 30d\n` +
      `👤 *Ejemplos:*\n` +
      `  #comprarproteccion 7d all\n` +
      `  #comprarproteccion 15d Miku`, m);
  }

  const duration = args[0].toLowerCase();
  const target = args.slice(1).join(' ').toLowerCase();
  const isAll = /all|todos|todo/.test(target);

  if (!durations[duration]) {
    return conn.reply(m.chat, `✘ Duración no válida. Usa: 3d, 7d, 15d o 30d`, m);
  }

  try {
    const harem = await loadHarem();
    const characters = await loadCharacters();
    const userChars = harem.filter(c => c.groupId === groupId && c.userId === userId);

    if (userChars.length === 0) {
      return conn.reply(m.chat, `✘ No tienes personajes en este grupo.`, m);
    }

    let toProtect = [];
    if (isAll) {
      toProtect = userChars;
    } else {
      toProtect = userChars.filter(c => {
        const char = findCharacterById(characters, c.characterId);
        return char && char.name.toLowerCase().includes(target);
      });
    }

    if (toProtect.length === 0) {
      return conn.reply(m.chat, `✘ No encontré ese personaje.`, m);
    }

    const price = calculatePrice(user.coin);
    const totalCost = price * toProtect.length;
    const expiresAt = Date.now() + durations[duration];

    if (user.coin < totalCost) {
      return conn.reply(m.chat,
        `💰 *Dinero insuficiente*\n\n` +
        `Necesitas: *¥${totalCost.toLocaleString()} ${m.moneda}*\n` +
        `Tienes: *¥${user.coin.toLocaleString()} ${m.moneda}*`, m);
    }

    toProtect.forEach(char => {
      char.protection = {
        protected: true,
        expiresAt: expiresAt,
        duration: duration
      };
    });

    user.coin -= totalCost;
    await saveHarem(harem);

    conn.reply(m.chat,
      `✅ *PROTECCIÓN COMPRADA*\n\n` +
      `📦 Personajes: *${toProtect.length}*\n` +
      `💰 Costo: *¥${totalCost.toLocaleString()} ${m.moneda}*\n` +
      `⏰ Duración: *${duration}*\n` +
      `📅 Expira: ${new Date(expiresAt).toLocaleDateString()}\n\n` +
      `💸 Cartera: *¥${user.coin.toLocaleString()} ${m.moneda}*`, m);

  } catch (error) {
    console.error(error);
    conn.reply(m.chat, `✘ Error: ${error.message}`, m);
  }
};

handler.help = ['comprarproteccion <duración> <personaje|all>'];
handler.tags = ['gacha', 'economia'];
handler.command = ['comprarproteccion', 'buyprotection', 'proteger'];
handler.group = true;
handler.register = true;

export default handler;