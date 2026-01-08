import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  userKey,
  charKey,
  addOrUpdateClaim,
  findClaim
} from '../lib/gacha-group.js';

const charactersFilePath = './src/database/characters.json';
export const cooldowns = {}; // clave: `${groupId}:${userId}`

global.activeRolls = global.activeRolls || {}; // claves: `${groupId}:${characterId}`

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('❀ No se pudo cargar el archivo characters.json.');
  }
}

let handler = async (m, { conn }) => {
  const userId = m.sender;
  const groupId = m.chat;
  const now = Date.now();

  const key = `${groupId}:${userId}`;
  if (cooldowns[key] && now < cooldowns[key]) {
    const remainingTime = Math.ceil((cooldowns[key] - now) / 1000);
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return await conn.reply(m.chat, `( ⸝⸝･̆⤚･̆⸝⸝) ¡Debes esperar *${minutes} minutos y ${seconds} segundos* para volver a usar *#rollwaifu* en este grupo.`, m);
  }

  try {
    const characters = await loadCharacters();
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    const randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)];

    // estado por grupo: buscamos si ya está reclamado en este grupo
    const harem = await loadHarem();
    const claimedInGroup = findClaim(harem, groupId, randomCharacter.id);

    const statusMessage = claimedInGroup ? `🚫 Ocupado (@${claimedInGroup.userId.split('@')[0]})` : '✅ Libre';

    // Solo creamos activeRolls para personajes libres en el grupo
    if (!claimedInGroup) {
      global.activeRolls[`${groupId}:${randomCharacter.id}`] = {
        user: userId,
        time: Date.now()
      };
    }

    const message = `ㅤㅤ⏜⋮ㅤㅤ꒰ㅤ꒰ㅤㅤ𖹭⃞🎲⃞𖹭ㅤㅤ꒱ㅤ꒱ㅤㅤ⋮⏜
꒰ㅤ꒰͡ㅤ 🄽🅄🄴🅅🄾 🄿🄴🅁🅂🄾🄽🄰🄹🄴ㅤㅤ͡꒱ㅤ꒱

▓𓏴𓏴 ۪ ֹ 🄽꯭🄾꯭🄼꯭🄱꯭🅁꯭🄴 :
╰┈➤ ❝ ${randomCharacter.name} ❞

▓𓏴𓏴 ۪ ֹ 🅅꯭🄰꯭🄻꯭🄾꯭🅁 :
╰┈➤ 🪙 ${randomCharacter.value}

▓𓏴𓏴 ۪ ֹ 🄴꯭🅂꯭🅃꯭🄰꯭🄳꯭🄾 :
╰┈➤ ${statusIcon} ${statusText}

▓𓏴𓏴 ۪ ֹ 🄳꯭🅄꯭🄴꯭🄽꯭̃🄾 :
╰┈➤ 👤 ${statusUser}

▓𓏴𓏴 ۪ ֹ 🄵꯭🅄꯭🄴꯭🄽꯭🅃꯭🄴 :
╰┈➤ 📖 ${randomCharacter.source}

┉͜┄͜─┈┉⃛┄─꒰֟፝͡ 🅸🅳: ${randomCharacter.id} ꒱─┄⃨┉┈─͡┄͡┉
ㅤㅤㅤㅤㅤㅤ©ㅤᑲ᥆𝗍ㅤ𝗀ɑᥴ꯭hɑㅤ𝗌𝗒sł꯭ᥱꭑ꒱`;

    const mentions = claimedInGroup ? [claimedInGroup.userId] : [];
    await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m, { mentions });

    // cooldown por grupo
    cooldowns[key] = now + 15 * 60 * 1000;

  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m);
  }
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
handler.group = true;

export default handler;