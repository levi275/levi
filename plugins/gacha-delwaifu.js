import { promises as fs } from 'fs';
import { loadHarem, saveHarem } from '../lib/gacha-group.js';

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

let handler = async (m, { conn, text }) => {
  const userId = m.sender;
  const groupId = m.chat;

  if (!text) {
    return m.reply(`Debes especificar un personaje para eliminar.\n\n> Ejemplo » *#delwaifu Aika Sano*`);
  }

  try {
    const characters = await loadCharacters();
    const keyword = text.trim().toLowerCase();

    const character = characters.find(c => c.name.toLowerCase().includes(keyword));
    if (!character) return m.reply(`El personaje *${text}* no existe.`);

    const harem = await loadHarem();
    const idx = harem.findIndex(c => c.groupId === groupId && c.userId === userId && c.characterId === character.id);
    if (idx === -1) {
      return m.reply(`El personaje *${character.name}* no ha sido reclamado por ti en este grupo.`);
    }

    harem.splice(idx, 1);
    await saveHarem(harem);

    m.reply(`✦ *${character.name}* ha sido eliminado de tus reclamados en este grupo.`);
  } catch (e) {
    console.error(e);
    m.reply(`✘ Ocurrió un error al intentar eliminar el personaje: ${e.message}`);
  }
};

handler.help = ['delwaifu <nombre>'];
handler.tags = ['waifus'];
handler.command = ['delwaifu', 'deletewaifu', 'delchar'];
handler.group = true;

export default handler;