const handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender];
  if (!user) return;

  const tiempoMinar = 12 * 60 * 1000;
  const now = Date.now();

  if (now - (user.lastmiming || 0) < tiempoMinar) {
    const restante = msToTime((user.lastmiming + tiempoMinar) - now);
    return conn.reply(m.chat, `⛏️ Aún te recuperas del último minado.\n⏳ Espera *${restante}*.`, m);
  }

  const esEventoPositivo = Math.random() < 0.78;
  const evento = esEventoPositivo ? pickRandom(eventosBuenos) : pickRandom(eventosMalos);
  const cambios = evento.cambios();

  user.coin = Math.max(0, (user.coin || 0) + cambios.coin);
  user.iron = Math.max(0, (user.iron || 0) + cambios.iron);
  user.gold = Math.max(0, (user.gold || 0) + cambios.gold);
  user.emerald = Math.max(0, (user.emerald || 0) + cambios.emerald);
  user.coal = Math.max(0, (user.coal || 0) + cambios.coal);
  user.stone = Math.max(0, (user.stone || 0) + cambios.stone);
  user.exp = (user.exp || 0) + cambios.exp;
  user.health = Math.max(0, (user.health || 100) - 15);
  user.pickaxedurability = Math.max(0, (user.pickaxedurability || 100) - 10);
  user.lastmiming = now;

  const resultado =
    `⛏️ *${evento.texto}*\n\n` +
    `✨ Exp: ${formato(cambios.exp)}\n` +
    `💸 ${m.moneda}: ${formato(cambios.coin)}\n` +
    `♦️ Esmeralda: ${formato(cambios.emerald)}\n` +
    `🔩 Hierro: ${formato(cambios.iron)}\n` +
    `🏅 Oro: ${formato(cambios.gold)}\n` +
    `🕋 Carbón: ${formato(cambios.coal)}\n` +
    `🪨 Piedra: ${formato(cambios.stone)}`;

  await conn.sendFile(m.chat, 'https://files.catbox.moe/qfx5pn.jpg', 'minado.jpg', resultado, m);
  await m.react('⛏️');
};

handler.help = ['minar'];
handler.tags = ['economy'];
handler.command = ['minar', 'miming', 'mine'];
handler.register = true;
handler.group = true;

export default handler;

const eventosBuenos = [
  { texto: '✨ Encontraste una veta de minerales.', cambios: () => ({ exp: r(120, 230), coin: r(900, 2200), emerald: r(1, 3), iron: r(8, 20), gold: r(4, 10), coal: r(10, 25), stone: r(80, 200) }) },
  { texto: '💰 Hallaste un cofre enterrado.', cambios: () => ({ exp: r(180, 300), coin: r(1600, 3200), emerald: r(1, 4), iron: r(10, 24), gold: r(5, 12), coal: r(12, 30), stone: r(100, 240) }) },
  { texto: '💎 Cueva antigua descubierta.', cambios: () => ({ exp: r(220, 360), coin: r(2200, 4200), emerald: r(2, 5), iron: r(12, 28), gold: r(6, 14), coal: r(14, 36), stone: r(120, 280) }) },
];

const eventosMalos = [
  { texto: '💥 Pequeño derrumbe en la mina.', cambios: () => ({ exp: r(40, 90), coin: -r(300, 900), emerald: -r(0, 1), iron: -r(1, 4), gold: -r(0, 2), coal: -r(2, 6), stone: -r(10, 30) }) },
  { texto: '🥵 Te perdiste buscando la salida.', cambios: () => ({ exp: r(30, 70), coin: -r(200, 700), emerald: 0, iron: r(0, 2), gold: 0, coal: r(1, 5), stone: r(5, 20) }) },
];

function r(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formato(num) {
  return num >= 0 ? `+${num}` : `-${Math.abs(num)}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  return `${minutes}m y ${seconds}s`;
}
