const handler = async (m, { conn, usedPrefix, command, participants }) => {
  try {
    const cooldown = 2 * 60 * 60 * 1000;
    const now = Date.now(); 

    let senderJid = m.sender;
    if (m.sender.endsWith('@lid') && m.isGroup) {
        const pInfo = participants.find(p => p.lid === m.sender);
        if (pInfo && pInfo.id) senderJid = pInfo.id; 
    }

    const user = global.db?.data?.users?.[senderJid];
    if (!user) return conn.reply(m.chat, `${emoji2} *Tu usuario no está registrado en la base de datos.*`, m);

    let target = null;
    if (m.isGroup) {
      target = (m.mentionedJid && m.mentionedJid.length > 0) ? m.mentionedJid[0] : (m.quoted && m.quoted.sender ? m.quoted.sender : null);
    } else {
      target = m.chat;
    }

    if (!target) {
      return conn.reply(m.chat, `${emoji2} *Debes mencionar a alguien para intentar robarle.*`, m);
    }

    let targetJid = target;
    if (target.endsWith('@lid') && m.isGroup) {
        const pInfo = participants.find(p => p.lid === target);
        if (pInfo && pInfo.id) targetJid = pInfo.id; 
    }

    if (targetJid === senderJid) {
      return conn.reply(m.chat, `${emoji2} *No puedes robarte a ti mismo.*`, m);
    }

    if (!global.db?.data?.users?.[targetJid]) {
      return conn.reply(m.chat, `${emoji2} *Ese usuario no está registrado en la base de datos.*`, m);
    }

    const targetUser = global.db.data.users[targetJid];

    targetUser.coin = Number.isFinite(targetUser.coin) ? Math.max(0, Number(targetUser.coin)) : 0;
    user.coin = Number.isFinite(user.coin) ? Number(user.coin) : 0;

    if (user.lastrob2 && (now - Number(user.lastrob2) < cooldown)) {
      const remaining = Number(user.lastrob2) + cooldown - now;
      const time = msToTime(remaining);
      return conn.reply(m.chat, `${emoji3} ✿ ¡Ya intentaste un robo! ✿\n⏳ Vuelve en *${time}* para hacerlo de nuevo.`, m);
    }

    const MIN_ROB = 1000;
    const MAX_ROB = 20000;
    const robAmount = Math.floor(Math.random() * (MAX_ROB - MIN_ROB + 1)) + MIN_ROB;

    if (targetUser.coin < MIN_ROB) {
      return conn.reply(m.chat, `${emoji2} @${target.split("@")[0]} *no tiene al menos ¥${MIN_ROB.toLocaleString()} ${m.moneda} fuera del banco para que valga la pena intentarlo.*`, m, { mentions: [target] });
    }

    const finalRob = Math.min(robAmount, targetUser.coin);

    targetUser.coin = Math.max(0, targetUser.coin - finalRob);
    user.coin = (user.coin || 0) + finalRob;
    user.lastrob2 = now;

    const frases = [
      `✿ ¡𝚁𝚘𝚋𝚘 𝙴𝚇𝙸𝚃𝙾𝚂𝙾! ✿\nHas saqueado a @${target.split("@")[0]} y te llevaste *¥${finalRob.toLocaleString()} ${m.moneda}* 💸`,
      `✿ Tu operación fue silenciosa y eficaz...\n¡Robaste *¥${finalRob.toLocaleString()} ${m.moneda}* a @${target.split("@")[0]}!`,
      `✿ Te pusiste la capucha y sin ser visto robaste *¥${finalRob.toLocaleString()} ${m.moneda}* a @${target.split("@")[0]} 😈`,
      `✿ 🏃 Escapaste por los callejones oscuros tras robar *¥${finalRob.toLocaleString()} ${m.moneda}* de @${target.split("@")[0]}`
    ];
    
    await conn.reply(m.chat, pickRandom(frases), m, { mentions: [target] });
  } catch (err) {
    console.error('Error en comando rob:', err);
    return conn.reply(m.chat, `${emoji2} Ocurrió un error al intentar ejecutar el comando. Intenta de nuevo más tarde.`, m);
  }
};

handler.help = ['rob'];
handler.tags = ['rpg'];
handler.command = ['robar', 'steal', 'rob'];
handler.group = true;
handler.register = true;
export default handler;
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
function msToTime(duration) {
  const totalSeconds = Math.max(0, Math.floor(duration / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours} Hora(s) ${minutes} Minuto(s)`;
}