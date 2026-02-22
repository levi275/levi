import { ensureJobFields, getJobData, pickRandom } from '../lib/rpg-jobs.js';

const cooldowns = {};
const jail = {};

const jobCrimeLines = {
  albañil: {
    success: [
      '🧱 Mientras hacías relleno en la obra, le tumbaste monedas al jefe distraído',
      '🏗️ Entre costales y cemento, te llevaste una caja chica sin levantar sospechas',
    ],
    fail: [
      '🚧 Te vieron en la bodega de materiales y te cayó multa de obra',
    ],
  },
  basurero: {
    success: [
      '🗑️ En la ruta de basura encontraste una cartera y te quedaste con lo valioso',
      '♻️ Revisando reciclaje diste con efectivo perdido y lo hiciste botín',
    ],
    fail: [
      '🚛 Una cámara del camión te grabó revisando donde no debías',
    ],
  },
  chef: {
    success: [
      '🍽️ Distrajiste al encargado con un banquete y vaciaste caja menor',
      '👨‍🍳 En el caos de cocina pico, limpiaste propinas ajenas sin que notaran',
    ],
    fail: [
      '🔥 Te cacharon manipulando caja del restaurante y pagaste sanción',
    ],
  },
  programador: {
    success: [
      '💻 Infiltraste una wallet vieja y sacaste saldo sin dejar logs',
      '🧠 Clonaste credenciales débiles y cobraste en silencio',
    ],
    fail: [
      '🛑 Te rastrearon por un endpoint mal cubierto y te multaron',
    ],
  },
  repartidor: {
    success: [
      '🛵 Cambiaste una entrega por otra y te quedaste el pago doble',
      '📦 Simulaste pedido cancelado y cobraron igual en efectivo',
    ],
    fail: [
      '🚦 Te cayó revisión de ruta y detectaron inconsistencias de cobro',
    ],
  },
  comerciante: {
    success: [
      '🛍️ Cerraste trato inflado y te guardaste una comisión fantasma',
      '📈 Moviste inventario en negro y sacaste ganancia limpia',
    ],
    fail: [
      '🧾 Auditoría sorpresa: se notó el faltante y te descontaron fuerte',
    ],
  },
};

const handler = async (m, { usedPrefix }) => {
  const users = global.db.data.users;
  const senderId = m.sender;
  const user = users[senderId];
  ensureJobFields(user);

  const job = getJobData(user);
  if (!job) {
    return m.reply(`💼 No tienes trabajo. Busca uno con *${usedPrefix}trabajo elegir <trabajo>* para desbloquear mejor rendimiento en #crime.`);
  }

  const cooldown = 8 * 60 * 1000;
  const jailCooldown = 16 * 60 * 1000;
  const now = Date.now();

  if (jail[senderId] && now < jail[senderId]) {
    const remaining = segundosAHMS(Math.ceil((jail[senderId] - now) / 1000));
    return m.reply(`🚔 Sigues en la cárcel. Te faltan *${remaining}* para volver al crimen.`);
  }

  if (cooldowns[senderId] && now - cooldowns[senderId] < cooldown) {
    const remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown - now) / 1000));
    return m.reply(`🚔 La zona está caliente, espera *${remaining}*.`);
  }

  const skill = Math.min(0.07, (user.jobXp || 0) / 300000);
  const jailChance = Math.max(0.04, (user.premium ? 0.09 : 0.13) - (job.crimeSuccessBonus * 0.4) - (skill * 0.5));
  const successChance = Math.min(0.86, (user.premium ? 0.6 : 0.5) + job.crimeSuccessBonus + skill);
  const roll = Math.random();

  if (roll < jailChance) {
    jail[senderId] = now + jailCooldown;
    cooldowns[senderId] = now;
    return m.reply(`${pickRandom(jobCrimeLines[job.key]?.fail || ['🚨 Te salió mal y caíste'])}. Te encerraron por 16 minutos.`);
  }

  if (roll < jailChance + successChance) {
    const amount = Math.floor((Math.random() * 62000 + 32000) * job.crimeRewardMultiplier * (user.premium ? 1.18 : 1));
    user.coin = (user.coin || 0) + amount;
    user.jobXp = (user.jobXp || 0) + Math.floor(amount * 0.08);
    cooldowns[senderId] = now;
    return m.reply(`${pickRandom(jobCrimeLines[job.key]?.success || ['😈 Golpe limpio'])}\n💸 Ganaste *${amount.toLocaleString()} ${m.moneda}*.`);
  }

  const loss = Math.min(Math.floor((Math.random() * 26000 + 12000) * (user.premium ? 0.85 : 1)), Math.floor((user.coin || 0) * 0.55));
  user.coin = Math.max(0, (user.coin || 0) - loss);
  cooldowns[senderId] = now;
  return m.reply(`${pickRandom(jobCrimeLines[job.key]?.fail || ['🚨 Fracasaste en el golpe'])}\n💸 Perdiste *${loss.toLocaleString()} ${m.moneda}*.`);
};

handler.help = ['crimen'];
handler.tags = ['economy'];
handler.command = ['crimen', 'crime'];
handler.group = true;
handler.register = true;

export default handler;

function toNum(number) {
  if (number >= 1000 && number < 1000000) return (number / 1000).toFixed(1) + 'k';
  if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M';
  return number.toString();
}

function segundosAHMS(segundos) {
  let minutos = Math.floor((segundos % 3600) / 60);
  let segundosRestantes = segundos % 60;
  return `${minutos} minutos y ${segundosRestantes} segundos`;
}
