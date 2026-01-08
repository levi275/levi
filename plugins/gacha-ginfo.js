import { promises as fs } from 'fs';

import { cooldowns as rwCooldowns } from './gacha-rollwaifu.js';
import { cooldowns as claimCooldowns } from './gacha-claim.js';
import { cooldowns as voteCooldowns, voteCooldownTime } from './gacha-vote.js';

const charactersFilePath = './src/database/characters.json';

function formatTime(ms) {
  if (!ms || ms <= 0) return 'Ahora.';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} minutos ${seconds} segundos`;
}

let handler = async (m, { conn }) => {
  const userId = m.sender;
  const now = Date.now();
  const groupId = m.chat;
  let userName;

  try {
    userName = await conn.getName(userId);
  } catch {
    userName = userId;
  }

  try {
    // Roll cooldown
    const rwKey = `${groupId}:${userId}`;
    const rwExpiration = rwCooldowns?.[rwKey] || 0;
    const rwRemaining = rwExpiration - now;
    const rwStatus = formatTime(rwRemaining);

    // Claim cooldown
    const claimKey = `${groupId}:${userId}`;
    const claimExpiration = claimCooldowns?.[claimKey] || 0;
    const claimRemaining = claimExpiration - now;
    const claimStatus = formatTime(claimRemaining);

    // Vote cooldown (we stored vote cooldowns in gacha-vote's export)
    let voteStatus = 'Ahora.';
    if (voteCooldowns && typeof voteCooldowns.get !== 'function') {
      // voteCooldowns is an object keyed by `${groupId}:${userId}`
      const voteKey = `${groupId}:${userId}`;
      const lastVoteTime = voteCooldowns?.[voteKey];
      if (lastVoteTime) {
        const voteExpiration = lastVoteTime + (voteCooldownTime || 0);
        const voteRemaining = voteExpiration - now;
        voteStatus = formatTime(voteRemaining);
      }
    }

    let allCharacters = [];
    try {
      const data = await fs.readFile(charactersFilePath, 'utf-8');
      allCharacters = JSON.parse(data);
    } catch (e) {
      console.error('Error leyendo characters.json:', e.message);
      return conn.reply(m.chat, 'Hubo un error al cargar la base de datos de personajes.', m);
    }

    // contamos claims en este grupo leyendo harem.json
    let harem = [];
    try {
      harem = JSON.parse(await fs.readFile('./src/database/harem.json', 'utf-8'));
    } catch {
      harem = [];
    }
    const userCharacters = harem.filter(c => c.groupId === groupId && c.userId === userId);
    const claimedCount = userCharacters.length;
    const totalCharacters = allCharacters.length;

    const totalValue = userCharacters.reduce((sum, char) => {
      const ch = allCharacters.find(c => c.id === char.characterId);
      return sum + (Number(ch?.value) || 0);
    }, 0);

    let response = `*❀ Usuario \`<${userName}>\`*\n\n`;
    response += `ⴵ RollWaifu » *${rwStatus}*\n`;
    response += `ⴵ Claim » *${claimStatus}*\n`;
    response += `ⴵ Vote » *${voteStatus}*\n\n`;
    response += `♡ Personajes reclamados en este grupo » *${claimedCount} / ${totalCharacters}*\n`;
    response += `✰ Valor total (est.) » *${totalValue.toLocaleString('es-ES')}*`;

    await conn.reply(m.chat, response, m);

  } catch (e) {
    console.error('Error en handler ginfo:', e);
    await conn.reply(m.chat, '✘ Ocurrió un error al verificar tu estado.', m);
  }
};

handler.help = ['estado', 'status', 'cooldowns', 'cd'];
handler.tags = ['info'];
handler.command = ['infogacha', 'ginfo', 'gachainfo'];
handler.group = true;

export default handler;