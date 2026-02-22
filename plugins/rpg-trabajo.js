import { JOBS, normalizeJobInput, ensureJobFields, getJobData, getJobTenureDays } from '../lib/rpg-jobs.js';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const user = global.db.data.users[m.sender];
  ensureJobFields(user);

  const sub = (args[0] || '').toLowerCase();

  if (!sub || ['lista', 'list', 'ver'].includes(sub)) {
    let txt = '💼 *Sistema de Trabajos*\n\n';
    txt += 'Elige un trabajo para poder usar *#work*.\n';
    txt += 'Tu empleo influye en *#work, #crime y #slut*.\n\n';
    txt += '*Trabajos disponibles:*\n';
    for (const k of Object.keys(JOBS)) {
      const j = JOBS[k];
      txt += `• ${j.emoji} *${j.name}* (${k})\n  ↳ ${j.description}\n`;
    }
    txt += `\nUsa: *${usedPrefix}${command} elegir <trabajo>*\n`;
    txt += `Ejemplo: *${usedPrefix}${command} elegir programador*\n`;
    txt += `Para renunciar: *${usedPrefix}${command} renunciar*`;
    return conn.reply(m.chat, txt, m);
  }

  if (['estado', 'info', 'actual'].includes(sub)) {
    const current = getJobData(user);
    if (!current) return conn.reply(m.chat, '🧾 No tienes trabajo actualmente. Usa *#trabajo elegir <trabajo>*.', m);
    const days = getJobTenureDays(user);
    return conn.reply(
      m.chat,
      `🧾 *Trabajo actual*\n` +
        `• Puesto: ${current.emoji} *${current.name}*\n` +
        `• Antigüedad: *${days} día(s)*\n` +
        `• Progreso laboral: *${(user.jobXp || 0).toLocaleString()} XP laboral*`,
      m,
    );
  }

  if (['elegir', 'tomar', 'set', 'escoger'].includes(sub)) {
    const selected = normalizeJobInput(args.slice(1).join(' '));
    if (!selected) {
      return conn.reply(m.chat, `❌ Trabajo inválido. Usa *${usedPrefix}${command} lista* para ver opciones.`, m);
    }

    if (user.job === selected) {
      return conn.reply(m.chat, `⚠️ Ya trabajas como *${JOBS[selected].name}*.`, m);
    }

    user.job = selected;
    user.jobSince = Date.now();
    user.jobXp = 0;

    return conn.reply(
      m.chat,
      `✅ Ahora trabajas como ${JOBS[selected].emoji} *${JOBS[selected].name}*.\n` +
        `Desde ahora tus resultados en economía se ajustarán a tu profesión.`,
      m,
    );
  }

  if (['renunciar', 'dejar', 'salir'].includes(sub)) {
    const current = getJobData(user);
    if (!current) return conn.reply(m.chat, '⚠️ No puedes renunciar porque no tienes empleo.', m);

    const days = getJobTenureDays(user);
    const totalMoney = (user.coin || 0) + (user.bank || 0);
    const basePenaltyRate = days >= 30 ? 0.12 : days >= 14 ? 0.08 : days >= 7 ? 0.05 : 0.02;
    const penalty = Math.min(120000, Math.floor(totalMoney * basePenaltyRate));

    let remaining = penalty;
    const fromCoin = Math.min(user.coin || 0, remaining);
    user.coin = Math.max(0, (user.coin || 0) - fromCoin);
    remaining -= fromCoin;

    const fromBank = Math.min(user.bank || 0, remaining);
    user.bank = Math.max(0, (user.bank || 0) - fromBank);

    user.job = null;
    user.jobSince = 0;
    user.jobXp = 0;

    return conn.reply(
      m.chat,
      `📄 Renunciaste a tu empleo de *${current.name}*.\n` +
        `💸 Penalización por salida (${days} día(s) de antigüedad): *-${penalty.toLocaleString()} ${m.moneda}*\n` +
        `🏦 Se descontó de cartera/banco según disponibilidad.`,
      m,
    );
  }

  return conn.reply(m.chat, `Comando no válido. Usa *${usedPrefix}${command} lista*`, m);
};

handler.help = ['trabajo', 'trabajo lista', 'trabajo elegir <trabajo>', 'trabajo renunciar'];
handler.tags = ['economy', 'rpg'];
handler.command = ['trabajo', 'job', 'empleo'];
handler.group = true;
handler.register = true;

export default handler;
