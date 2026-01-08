import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  loadVentas
} from '../lib/gacha-group.js';

const charactersFilePath = './src/database/characters.json';
export let cooldowns = {}; // clave: `${groupId}:${userId}`
export const voteCooldownTime = 1 * 60 * 60 * 1000; // 1 hora

let characterVotes = {}; // clave: `${groupId}:${characterId}` => timestamp

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

let handler = async (m, { conn, args }) => {
  try {
    const userId = m.sender;
    const groupId = m.chat;
    const userKey = `${groupId}:${userId}`;

    if (cooldowns[userKey]) {
      const expirationTime = cooldowns[userKey] + voteCooldownTime;
      const now = Date.now();
      if (now < expirationTime) {
        const timeLeft = expirationTime - now;
        const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        await conn.reply(m.chat, `Debes esperar *${minutes} minutos ${seconds} segundos* para usar *#vote* de nuevo en este grupo.`, m);
        return;
      }
    }

    const characters = await loadCharacters();
    const characterName = args.join(' ').trim();
    if (!characterName) {
      await conn.reply(m.chat, 'Debes especificar un personaje para votarlo. Ej: #vote Aika Sano', m);
      return;
    }

    const character = characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
    if (!character) {
      await conn.reply(m.chat, 'Personaje no encontrado. Asegúrate del nombre correcto.', m);
      return;
    }

    const charVoteKey = `${groupId}:${character.id}`;
    const now = Date.now();
    if (characterVotes[charVoteKey] && now < characterVotes[charVoteKey]) {
      const expirationTime = characterVotes[charVoteKey];
      const timeLeft = expirationTime - now;
      const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      await conn.reply(m.chat, `El personaje *${character.name}* ya fue votado recientemente en este grupo. Espera *${minutes} minutos ${seconds} segundos* para volver a votarlo aquí.`, m);
      return;
    }

    const incrementValue = Math.floor(Math.random() * 10) + 1;
    character.value = String(Number(character.value || 0) + incrementValue);
    character.votes = (character.votes || 0) + 1;
    await saveCharacters(characters);

    // Guardamos voto en harem (registro simple opcional)
    const harem = await loadHarem();
    const saleList = await loadVentas(); // no usado ahora, pero puede ser útil
    // No guardamos ownership here; solo actualizamos cooldowns por grupo
    cooldowns[userKey] = Date.now();

    // bloqueamos el personaje en el grupo temporalmente para evitar votaciones demasiado seguidas
    characterVotes[charVoteKey] = Date.now() + voteCooldownTime;

    await conn.reply(m.chat, `✰ Votaste por el personaje *${character.name}*\n› Nuevo valor: *${character.value}* (incrementado en *${incrementValue}*)\n› Total de votos: *${character.votes}*`, m);
  } catch (e) {
    await conn.reply(m.chat, `✘ Error al procesar el voto: ${e.message}`, m);
  }
};

handler.help = ['vote <nombre>'];
handler.tags = ['anime'];
handler.command = ['vote', 'votar'];
handler.group = true;
handler.register = true;

export default handler;