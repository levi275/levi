import { loadHarem, saveHarem } from '../lib/gacha-group.js';
import { loadCharacters, findCharacterById } from '../lib/gacha-characters.js';

let cooldowns = {};

function isProtected(character) {
  if (!character.protection?.protected) return false;
  if (Date.now() > character.protection.expiresAt) {
    character.protection.protected = false;
    return false;
  }
  return true;
}

let handler = async (m, { conn }) => {
  const userId = m.sender;
  const groupId = m.chat;
  const now = Date.now();

  const cooldownKey = `${groupId}:${userId}`;
  if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
    const remaining = cooldowns[cooldownKey] - now;
    const minutes = Math.floor(remaining / 60000);
    return conn.reply(m.chat, `⏳ Ya intentaste robar. Espera *${minutes}m* más.`, m);
  }

  if (!m.mentionedJid || m.mentionedJid.length === 0) {
    return conn.reply(m.chat, `✘ Menciona a alguien: *#robwaifu @usuario*`, m);
  }

  const victimJid = m.mentionedJid[0];
  const victimName = await conn.getName(victimJid);

  try {
    const harem = await loadHarem();
    const characters = await loadCharacters();

    const victimChars = harem.filter(c => c.groupId === groupId && c.userId === victimJid);

    if (victimChars.length === 0) {
      return conn.reply(m.chat, `👤 *${victimName}* no tiene personajes.`, m);
    }

    const unprotected = victimChars.filter(c => !isProtected(c));

    if (unprotected.length === 0) {
      return conn.reply(m.chat,
        `🔒 Todos los personajes de *${victimName}* están protegidos!\n\n` +
        `✘ No pudiste robar nada.`, m);
    }

    const success = Math.random() < 0.6;

    if (!success) {
      const thief = global.db.data.users[userId];
      if (thief && thief.coin >= 500) {
        thief.coin -= 500;
      }
      conn.reply(m.chat,
        `🚫 *${victimName}* te atrapó intentando robar!\n\n` +
        `💔 Perdiste *¥500 ${m.moneda}*.`, m);
      cooldowns[cooldownKey] = now + (30 * 60 * 1000);
      return;
    }

    const randomIdx = Math.floor(Math.random() * unprotected.length);
    const stolen = unprotected[randomIdx];
    const charData = findCharacterById(characters, stolen.characterId);
    const charName = charData?.name || 'Desconocido';

    const victimIdx = harem.findIndex(c =>
      c.groupId === groupId &&
      c.userId === victimJid &&
      c.characterId === stolen.characterId
    );

    if (victimIdx !== -1) {
      harem[victimIdx].userId = userId;
      await saveHarem(harem);

      conn.reply(m.chat,
        `🎭 *¡ROBO EXITOSO!*\n\n` +
        `✅ Robaste a *${charName}* de *${victimName}*\n` +
        `⏰ Próximo robo en 80 minutos.`, m);

      cooldowns[cooldownKey] = now + (80 * 60 * 1000);
    }

  } catch (error) {
    console.error(error);
    conn.reply(m.chat, `✘ Error: ${error.message}`, m);
  }
};

handler.help = ['robwaifu @usuario'];
handler.tags = ['gacha'];
handler.command = ['robwaifu', 'stealwaifu', 'rob'];
handler.group = true;
handler.register = true;

export default handler;