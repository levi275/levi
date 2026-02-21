import { promises as fs } from 'fs';
const charactersFilePath = './src/database/characters.json';
const groupVotesFilePath = './src/database/groupVotes.json';
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

async function loadGroupVotes() {
  try {
    const data = await fs.readFile(groupVotesFilePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw new Error('No se pudo cargar el archivo groupVotes.json.');
  }
}

async function saveGroupVotes(groupVotes) {
  try {
    await fs.writeFile(groupVotesFilePath, JSON.stringify(groupVotes, null, 2), 'utf-8');
  } catch (error) {
    throw new Error('No se pudo guardar el archivo groupVotes.json.');
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
    const groupVotes = await loadGroupVotes();
    const groupCharacterKey = `${groupId}:${character.id}`;

    const baseValue = Number(character.value || 0);
    const currentGroupData = groupVotes[groupCharacterKey] || {
      groupId,
      characterId: character.id,
      valueBonus: 0,
      votes: 0
    };

    currentGroupData.valueBonus += incrementValue;
    currentGroupData.votes += 1;
    currentGroupData.groupId = groupId;
    currentGroupData.characterId = character.id;

    groupVotes[groupCharacterKey] = currentGroupData;
    await saveGroupVotes(groupVotes);

    // mantenemos votes global para compatibilidad con comandos antiguos
    character.votes = (character.votes || 0) + 1;
    await saveCharacters(characters);

    // No guardamos ownership aquí; solo actualizamos cooldowns por grupo
    cooldowns[userKey] = Date.now();

    // bloqueamos el personaje en el grupo temporalmente para evitar votaciones demasiado seguidas
    characterVotes[charVoteKey] = Date.now() + voteCooldownTime;

    const groupValue = baseValue + currentGroupData.valueBonus;
    await conn.reply(m.chat, `✰ Votaste por el personaje *${character.name}*\n› Valor en este grupo: *${groupValue}* (incrementado en *${incrementValue}*)\n› Votos en este grupo: *${currentGroupData.votes}*`, m);
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
