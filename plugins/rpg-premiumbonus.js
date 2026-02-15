const handler = async (m, { conn, isPrems }) => {
  const user = global.db.data.users[m.sender];
  if (!isPrems && !user.premium) {
    return conn.reply(m.chat, '🔒 Este comando es exclusivo para usuarios premium.', m);
  }

  const cooldown = 12 * 60 * 60 * 1000;
  const now = Date.now();

  if (now - (user.lastpremiumbonus || 0) < cooldown) {
    const restante = msToTime((user.lastpremiumbonus + cooldown) - now);
    return conn.reply(m.chat, `👑 Ya reclamaste tu bonus premium.\n⏳ Vuelve en *${restante}*.`, m);
  }

  const coinReward = randomInt(4000, 9000);
  const expReward = randomInt(350, 900);
  const diamondReward = randomInt(1, 3);

  user.coin = (user.coin || 0) + coinReward;
  user.exp = (user.exp || 0) + expReward;
  user.diamond = (user.diamond || 0) + diamondReward;
  user.lastpremiumbonus = now;

  return conn.reply(
    m.chat,
    `👑 *Bonus Premium reclamado*\n\n` +
      `💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
      `✨ Exp: *+${expReward}*\n` +
      `💎 Diamantes: *+${diamondReward}*`,
    m,
  );
};

handler.help = ['premiumbonus'];
handler.tags = ['premium', 'economy'];
handler.command = ['premiumbonus', 'bonopremium', 'claimpremium'];
handler.group = true;
handler.register = true;

export default handler;

function msToTime(duration) {
  const totalSeconds = Math.max(0, Math.floor(duration / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
