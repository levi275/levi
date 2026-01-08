import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  addOrUpdateClaim,
  removeClaim,
  getUserClaims
} from '../lib/gacha-group.js';

const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('No se pudo cargar el archivo characters.json.');
  }
}

async function saveCharacters(characters) {
  try {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
  } catch (error) {
    throw new Error('No se pudo guardar el archivo characters.json.');
  }
}

let handler = async (m, { conn, args, participants }) => {
  let userId = m.sender;
  if (m.sender.endsWith('@lid') && m.isGroup) {
    const pInfo = participants.find(p => p.lid === m.sender);
    if (pInfo && pInfo.id) userId = pInfo.id;
  }

  const groupId = m.chat;

  if (args.length < 2) {
    await conn.reply(m.chat, 'Debes especificar el nombre del personaje y mencionar a quien quieras regalarlo. Ej: #regalar Aika Sano @user', m);
    return;
  }

  const characterName = args.slice(0, -1).join(' ').toLowerCase().trim();
  let rawWho = m.mentionedJid?.[0];

  if (!rawWho) {
    await conn.reply(m.chat, 'Debes mencionar a un usuario válido.', m);
    return;
  }

  let who = rawWho;
  if (rawWho.endsWith('@lid') && m.isGroup) {
    const pInfo = participants.find(p => p.lid === rawWho);
    if (pInfo && pInfo.id) who = pInfo.id;
  }

  try {
    const characters = await loadCharacters();
    const character = characters.find(c => c.name.toLowerCase() === characterName);

    if (!character) {
      await conn.reply(m.chat, `No se encontró el personaje *${characterName}*.`, m);
      return;
    }

    // verificar propiedad en este grupo
    const harem = await loadHarem();
    const claim = harem.find(c => c.groupId === groupId && c.characterId === character.id && c.userId === userId);
    if (!claim) {
      await conn.reply(m.chat, `El personaje *${character.name}* no está reclamado por ti en este grupo.`, m);
      return;
    }

    // transferir claim
    removeClaim(harem, groupId, userId, character.id);
    addOrUpdateClaim(harem, groupId, who, character.id);
    await saveHarem(harem);

    await conn.reply(m.chat, `✰ *${character.name}* ha sido regalado a @${who.split('@')[0]}!`, m, { mentions: [who] });
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al regalar el personaje: ${error.message}`, m);
  }
};

handler.help = ['regalar <nombre del personaje> @usuario'];
handler.tags = ['anime'];
handler.command = ['regalar', 'givewaifu', 'givechar'];
handler.group = true;

export default handler;