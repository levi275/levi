const handler = async (m, { conn, text, usedPrefix, command }) => {
  const user = global.db.data.users[m.sender];
  text = (text || '').toLowerCase().trim();

  const plans = {
    dia: { duration: 1, cost: 25000 },
    semana: { duration: 7, cost: 140000 },
    mes: { duration: 30, cost: 450000 },
  };

  if (!text || !plans[text]) {
    let response = `🎟️ *Planes Premium* 🎟️\n\n`;
    for (const plan of Object.keys(plans)) {
      const p = plans[plan];
      response += `• *${plan.toUpperCase()}* (${p.duration} día(s)) → *¥${p.cost.toLocaleString()} ${m.moneda}*\n`;
    }
    response += `\n*Beneficios premium:*\n`;
    response += `- Mejor cooldown en #rob\n`;
    response += `- +bonus en #daily y #weekly\n`;
    response += `- Acceso a #premiumbonus cada 12h\n`;
    response += `- Mayor límite en #ruleta\n\n`;
    response += `Ejemplo: *${usedPrefix + command} semana*`;
    return conn.reply(m.chat, response, m);
  }

  const selectedPlan = plans[text];

  if ((user.coin || 0) < selectedPlan.cost) {
    return conn.reply(
      m.chat,
      `❌ Te faltan ${m.moneda}. Necesitas *¥${selectedPlan.cost.toLocaleString()}* y tienes *¥${(user.coin || 0).toLocaleString()}*.`,
      m,
    );
  }

  user.coin -= selectedPlan.cost;
  user.premium = true;

  const extraMs = selectedPlan.duration * 24 * 60 * 60 * 1000;
  user.premiumTime = (user.premiumTime > Date.now() ? user.premiumTime : Date.now()) + extraMs;

  const bonusCoins = Math.floor(selectedPlan.cost * 0.06);
  const bonusExp = selectedPlan.duration * 300;
  user.coin += bonusCoins;
  user.exp = (user.exp || 0) + bonusExp;

  const remainingTime = user.premiumTime - Date.now();
  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  conn.reply(
    m.chat,
    `✅ Compraste *Premium ${text}*.\n\n` +
      `🎁 Bonus de compra:\n` +
      `• +${bonusCoins.toLocaleString()} ${m.moneda}\n` +
      `• +${bonusExp} EXP\n\n` +
      `⏳ Tiempo premium restante: *${days}d ${hours}h*`,
    m,
  );
};

handler.help = ['comprarpremium [plan]'];
handler.tags = ['premium'];
handler.command = ['comprarpremium', 'premium', 'vip'];
handler.register = true;

export default handler;
