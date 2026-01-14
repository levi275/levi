import { promises as fs } from 'fs';
import { loadHarem, saveHarem, userKey, charKey, addOrUpdateClaim, findClaim } from '../lib/gacha-group.js';

const charactersFilePath = './src/database/characters.json';
export const cooldowns = {};

global.activeRolls = global.activeRolls || {};

async function loadCharacters() {
try {
const data = await fs.readFile(charactersFilePath, 'utf-8');
return JSON.parse(data);
} catch (error) {
throw new Error('❀ No se pudo cargar el archivo characters.json.');
}
}

function formatUrl(url) {
if (!url) return url;
if (url.includes('github.com') && url.includes('/blob/')) {
return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
}
return url.trim();
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

cooldowns[key] = now + 15 * 60 * 1000;

try {
const characters = await loadCharacters();
const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
let randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)];

randomImage = formatUrl(randomImage);

if (randomImage.includes('.webp')) {
randomImage = `https://wsrv.nl/?url=${encodeURIComponent(randomImage)}&output=png`;
}

const harem = await loadHarem();
const claimedInGroup = findClaim(harem, groupId, randomCharacter.id);

const ownerName = claimedInGroup ? `@${claimedInGroup.userId.split('@')[0]}` : 'Nadie';

if (!claimedInGroup) {
global.activeRolls[`${groupId}:${randomCharacter.id}`] = { user: userId, time: Date.now() };
}

const message = `
ㅤㅤ⏜⋮ㅤㅤ꒰ㅤ꒰ㅤㅤ𖹭⃞🎲⃞𖹭ㅤㅤ꒱ㅤ꒱ㅤㅤ⋮⏜
꒰ㅤ꒰͡ㅤ 🄽🅄🄴🅅🄾 🄿🄴🅁🅂🄾🄽🄰🄹🄴ㅤㅤ͡꒱ㅤ꒱

▓𓏴𓏴 ۪ ֹ 🄽꯭🄾꯭🄼꯭🄱꯭🅁꯭🄴 :
╰┈➤ ❝ ${randomCharacter.name} ❞

▓𓏴𓏴 ۪ ֹ 🅅꯭🄰꯭🄻꯭🄾꯭🅁 :
╰┈➤ 🪙 ${randomCharacter.value}

▓𓏴𓏴 ۪ ֹ 🄴꯭🅂꯭🅃꯭🄰꯭🄳꯭🄾 :
╰┈➤ ✨ ꯭${claimedInGroup ? '🚫 Ocupado' : '✅ Libre'}

▓𓏴𓏴 ۪ ֹ 🄳꯭🅄꯭🄴꯭🄽꯭̃🄾 :
╰┈➤ 👤 ${ownerName}

▓𓏴𓏴 ۪ ֹ 🄵꯭🅄꯭🄴꯭🄽꯭🅃꯭🄴 :
╰┈➤ 📖 ${randomCharacter.source}

┉͜┄͜─┈┉⃛┄─꒰֟፝͡ 🅸🅳: ${randomCharacter.id} ꒱─┄⃨┉┈─͡┄͡┉
ㅤㅤㅤㅤㅤㅤ© ᑲ᥆𝗍 𝗀ɑᥴ꯭hɑ 𝗌𝗒sł꯭ᥱꭑ꒱
`;

const mentions = claimedInGroup ? [claimedInGroup.userId] : [];
await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m, { mentions });

} catch (error) {
delete cooldowns[key];
console.error(error);
await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m);
}
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
handler.group = true;

export default handler;
