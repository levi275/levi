import { ensureJobFields, getJobData, pickRandom } from '../lib/rpg-jobs.js';

let cooldowns = {};

const successByJob = {
  albañil: [
    '🧱 Llegaste marcado de cemento y eso prendió a tu cliente',
    '🏗️ Te viste rudo de obra y te llovieron billetes',
  ],
  basurero: [
    '🗑️ Te salió un cliente con fetiches raros y te pagó triple por uniforme de turno',
    '♻️ Tu actitud callejera encantó y cerraste trato caro',
  ],
  chef: [
    '👨‍🍳 Le cocinaste algo antes del acto y te dejó una mega propina',
    '🍓 Te armaste una escena gourmet y cobraste premium',
  ],
  programador: [
    '💻 Vendiste contenido exclusivo por suscripción y facturaste fuerte',
    '📲 Le montaste un show virtual privado y te pagaron en caliente',
  ],
  repartidor: [
    '🛵 Entrega express, servicio express: cliente satisfecho y propina alta',
    '📦 Te pidieron “paquete completo” y cobrastes extra',
  ],
  comerciante: [
    '🛍️ Negociaste tarifa VIP y cerraste una noche redonda',
    '💬 Con puro verbo subiste precio y aun así te compraron todo',
  ],
};

const failByJob = {
  basurero: [
    '🤢 Olías a basura al empezar con el acto porque no te bañaste después de la chamba y perdiste al cliente',
    '🧼 Te dijeron que volvieras cuando te quitaras el olor del turno y te cancelaron',
  ],
  default: [
    '💔 Se cayó el mood y te tocó pagar hotel y taxi',
    '🚔 Te cayó redada y soltaste plata para salir rápido',
    '📉 Cliente tóxico: no pagó y encima te dejó gastos',
  ],
};

const handler = async (m, { conn, usedPrefix }) => {
  const users = global.db.data.users;
  const senderId = m.sender;
  const user = users[senderId];
  ensureJobFields(user);

  const job = getJobData(user);
  if (!job) {
    return conn.reply(m.chat, `💼 Primero consigue trabajo con *${usedPrefix}trabajo elegir <trabajo>*. Tu oficio afecta #slut.`, m);
  }

  const cooldown = 5 * 60 * 1000;
  const now = Date.now();
  if (cooldowns[senderId] && now - cooldowns[senderId] < cooldown) {
    const remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown - now) / 1000));
    return m.reply(`🥵 Necesitas recuperar el aliento. Vuelve en *${remaining}*.`);
  }

  const userIds = Object.keys(users).filter(u => u !== senderId && !users[u].banned);
  const targetId = userIds.length > 0 ? pickRandom(userIds) : senderId;

  const prof = Math.min(0.08, (user.jobXp || 0) / 300000);
  const winChance = Math.min(0.87, 0.64 + (user.premium ? 0.06 : 0) + prof);
  const didWin = Math.random() < winChance;

  if (didWin) {
    const amount = Math.floor((Math.random() * 68000 + 28000) * job.slutMultiplier * (user.premium ? 1.2 : 1));
    user.coin = (user.coin || 0) + amount;
    user.jobXp = (user.jobXp || 0) + Math.floor(amount * 0.07);
    cooldowns[senderId] = now;
    const phrase = pickRandom(successByJob[job.key] || successByJob.repartidor);

    await conn.sendMessage(
      m.chat,
      {
        text: `${job.emoji} *${job.name}*\n${phrase}.\n💸 Ganaste *¥${amount.toLocaleString()} ${m.moneda}* con @${targetId.split('@')[0]}.`,
        contextInfo: { mentionedJid: [targetId] },
      },
      { quoted: m },
    );
    return;
  }

  const amount = Math.floor((Math.random() * 28000 + 11000) * job.slutLossMultiplier);
  const loss = Math.min((user.coin || 0) + (user.bank || 0), amount);

  let rest = loss;
  const fromCoin = Math.min(user.coin || 0, rest);
  user.coin = Math.max(0, (user.coin || 0) - fromCoin);
  rest -= fromCoin;
  user.bank = Math.max(0, (user.bank || 0) - rest);

  cooldowns[senderId] = now;
  const failLines = failByJob[job.key] || failByJob.default;
  const phrase = pickRandom(failLines);
  return conn.reply(m.chat, `${job.emoji} *${job.name}*\n${phrase}.\n💸 Perdiste *¥${loss.toLocaleString()} ${m.moneda}*.`, m);
};

handler.help = ['slut'];
handler.tags = ['economy'];
handler.command = ['slut', 'prostituirse'];
handler.group = true;
handler.register = true;

export default handler;

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60);
  let segundosRestantes = segundos % 60;
  return `${minutos}m ${segundosRestantes}s`;
}
