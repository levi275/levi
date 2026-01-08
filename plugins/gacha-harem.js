import { promises as fs } from 'fs';
import { getUserClaims, loadHarem } from '../src/lib/gacha-group.js';

const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('No se pudo cargar el archivo characters.json.');
  }
}

async function loadHaremFile() {
  return await loadHarem();
}

let handler = async (m, { conn, args, participants }) => {
  try {
    const characters = await loadCharacters();
    const harem = await loadHaremFile();
    let rawUserId;

    if (m.quoted && m.quoted.sender) {
      rawUserId = m.quoted.sender;
    } else if (m.mentionedJid && m.mentionedJid[0]) {
      rawUserId = m.mentionedJid[0];
    } else if (args[0] && args[0].startsWith('@')) {
      rawUserId = args[0].replace('@', '') + '@s.whatsapp.net';
    } else {
      rawUserId = m.sender;
    }

    let userId = rawUserId;
    if (rawUserId.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find(p => p.lid === rawUserId);
      if (pInfo && pInfo.id) userId = pInfo.id;
    }

    const groupId = m.chat;

    // obtenemos claims de este usuario solo en este grupo
    const userClaims = getUserClaims(harem, groupId, userId);

    if (userClaims.length === 0) {
      await conn.reply(m.chat, '❀ No tienes personajes reclamados en este grupo.', m);
      return;
    }

    let pageArg = args.find(arg => /^\d+$/.test(arg));
    const page = parseInt(pageArg) || 1;
    const charactersPerPage = 50;
    const totalCharacters = userClaims.length;
    const totalPages = Math.ceil(totalCharacters / charactersPerPage);
    const startIndex = (page - 1) * charactersPerPage;
    const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters);

    if (page < 1 || page > totalPages) {
      await conn.reply(m.chat, `❀ Página no válida. Hay un total de *${totalPages}* páginas.`, m);
      return;
    }

    let message = `✿ Personajes reclamados en este grupo ✿\n`;
    message += `⌦ Usuario: @${userId.split('@')[0]}\n`;
    message += `♡ Personajes: *(${totalCharacters}):*\n\n`;

    for (let i = startIndex; i < endIndex; i++) {
      const charId = userClaims[i].characterId;
      const character = characters.find(c => c.id === charId);
      const name = character ? character.name : `ID:${charId}`;
      const value = character ? (character.value || '0') : '0';
      message += `» *${name}* (*${value}*)\n`;
    }

    message += `\n> ⌦ _Página *${page}* de *${totalPages}*_`;

    await conn.reply(m.chat, message, m, { mentions: [userId] });
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar el harem: ${error.message}`, m);
  }
};

handler.help = ['harem [@usuario] [pagina]'];
handler.tags = ['anime'];
handler.command = ['harem', 'claims', 'waifus'];
handler.group = true;

export default handler;