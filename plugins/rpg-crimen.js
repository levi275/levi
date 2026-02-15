const cooldowns = {};
const jail = {};

const handler = async (m) => {
  const users = global.db.data.users;
  const senderId = m.sender;
  const user = users[senderId];

  const cooldown = 10 * 60 * 1000;
  const jailCooldown = 20 * 60 * 1000;

  if (jail[senderId] && Date.now() < jail[senderId]) {
    const remaining = segundosAHMS(Math.ceil((jail[senderId] - Date.now()) / 1000));
    return m.reply(`🚔 Sigues en la cárcel. Te faltan *${remaining}* para volver al crimen.`);
  }

  if (cooldowns[senderId] && Date.now() - cooldowns[senderId] < cooldown) {
    const remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown - Date.now()) / 1000));
    return m.reply(`🚔 La zona está caliente, espera *${remaining}*.`);
  }

  const jailChance = user.premium ? 0.07 : 0.12;
  const successChance = user.premium ? 0.68 : 0.62;
  const outcome = Math.random();

  if (outcome < jailChance) {
    jail[senderId] = Date.now() + jailCooldown;
    cooldowns[senderId] = Date.now();
    return m.reply(`${pickRandom(frasesPolicia)}. Te encerraron por 20 minutos.`);
  }

  if (outcome < jailChance + successChance) {
    const amount = Math.floor(Math.random() * 6500) + 2500;
    user.coin += amount;
    cooldowns[senderId] = Date.now();
    return m.reply(`${pickRandom(frasesExito)}\n💸 Ganaste *${amount.toLocaleString()} ${m.moneda}*.`);
  }

  const amount = Math.floor(Math.random() * 4500) + 1500;
  const safeLoss = Math.min(amount, Math.floor((user.coin || 0) * 0.6));
  user.coin = Math.max(0, (user.coin || 0) - safeLoss);
  cooldowns[senderId] = Date.now();

  return m.reply(`${pickRandom(frasesFracaso)}\n💸 Perdiste *${safeLoss.toLocaleString()} ${m.moneda}*.`);
};

handler.help = ['crimen'];
handler.tags = ['economy'];
handler.command = ['crimen', 'crime'];
handler.group = true;
handler.register = true;

export default handler;

function segundosAHMS(segundos) {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  return `${minutos}m ${segundosRestantes}s`;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const frasesExito = [
  '🕶️ Hiciste un golpe limpio en una joyería clandestina',
  '💻 Vulneraste una wallet olvidada y sacaste saldo',
  '🏍️ Asaltaste un convoy y escapaste antes de que reaccionaran',
  '🎭 Engañaste a un estafador profesional y le diste la vuelta'
];

const frasesFracaso = [
  '🧾 Te rastrearon por una cámara mal ubicada',
  '🚨 Sonó una alarma silenciosa y corriste sin botín',
  '🥶 Te congelaste en la huida y abandonaste parte del plan',
  '🧠 Dudaste en el momento clave y salió mal'
];

const frasesPolicia = [
  '👮 Te encerraron tras un operativo sorpresa',
  '🚔 Te capturaron cuando intentabas escapar en moto',
  '📡 Interceptaron tus mensajes y cayeron sobre ti'
];
