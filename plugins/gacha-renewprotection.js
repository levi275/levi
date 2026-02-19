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

let handler = async (m, { conn, args }) => {
  const userId = m.sender;
  const groupId = m.chat;
  const user = global.db.data.users[userId];

  if (!user) return conn.reply(m.chat, `✘ Usuario no registrado.`, m);

  if (args.length < 2) {
    return conn.reply(m.chat, `🔄 *Uso: #renovarproteccion <duración> <personaje|all>*`, m);
  }

  const duration = args[0].toLowerCase();
  const target = args.slice(1).join(' ').toLowerCase();
  const isAll = /all|todos/.test(target);

  if (!durations[duration]) {
    return conn.reply(m.chat, `✘ Duración no válida.`, m);
  }

  try {
    const harem = await loadHarem();
    const characters = await loadCharacters();
    const userChars = harem.filter(c => c.groupId === groupId && c.userId === userId);

    let toRenew = [];
    if (isAll) {
      toRenew = userChars.filter(c => c.protection?.protected);
    } else {
      toRenew = userChars.filter(c => {
        const char = findCharacterById(characters, c.characterId);
        return char && char.name.toLowerCase().includes(target) && c.protection?.protected;
      });
    }

    if (toRenew.length === 0) {
      return conn.reply(m.chat, `✘ Ese personaje no tiene protección activa.`, m);
    }

    const price = calculatePrice(user.coin);
    const totalCost = price * toRenew.length;
    const newExpiry = Date.now() + durations[duration];

    if (user.coin < totalCost) {
      return conn.reply(m.chat, `💰 Dinero insuficiente para renovar.`, m);
    }

    toRenew.forEach(char => {
      char.protection.expiresAt = newExpiry;
      char.protection.duration = duration;
    });

    user.coin -= totalCost;
    await saveHarem(harem);

    conn.reply(m.chat,
      `✅ *PROTECCIÓN RENOVADA*\n\n` +
      `📦 Personajes: *${toRenew.length}*\n` +
      `💰 Costo: *¥${totalCost.toLocaleString()} ${m.moneda}*\n` +
      `📅 Nuevo vencimiento: ${new Date(newExpiry).toLocaleDateString()}`, m);

  } catch (error) {
    console.error(error);
    conn.reply(m.chat, `✘ Error: ${error.message}`, m);
  }
};

handler.help = ['renovarproteccion <duración> <personaje|all>'];
handler.tags = ['gacha'];
handler.command = ['renovarproteccion', 'renewprotection', 'extenderproteccion'];
handler.group = true;
handler.register = true;

export default handler;