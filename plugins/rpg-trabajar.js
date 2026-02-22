import { ensureJobFields, getJobData, pickRandom } from '../lib/rpg-jobs.js';

const cooldowns = {};

const scenarios = {
  albañil: {
    success: [
      '🧱 Levantaste una pared perfecta en tiempo récord y el maestro te soltó buena paga',
      '🏗️ Te rifaste haciendo el relleno de una obra y te dieron bono por productividad',
      '🔨 Reforzaste columnas sin errores y te pagaron horas extra',
    ],
    fail: [
      '🪨 Se te vino abajo una mezcla mal hecha y te descontaron materiales',
      '🧯 Te retrasaste en la obra y te rebajaron parte de la jornada',
    ],
  },
  basurero: {
    success: [
      '🗑️ Cubriste dos rutas completas de recolección y te dieron prima de puntualidad',
      '🚛 Separaste reciclaje como pro y te pagaron incentivo ecológico',
      '♻️ Encontraste material valioso en la planta y te premiaron',
    ],
    fail: [
      '🧪 Se rompió una bolsa tóxica y te tocó pagar equipo nuevo',
      '🌧️ Un turno bajo lluvia te dejó pérdidas por retraso de ruta',
    ],
  },
  chef: {
    success: [
      '👨‍🍳 Tu menú del día se agotó y te llevaste propinas premium',
      '🍰 Te pidieron catering urgente y cobraste extra',
      '🥘 Sacaste pedidos perfectos en hora pico y te dieron bono',
    ],
    fail: [
      '🔥 Se te quemó una tanda completa y tocó reponer ingredientes',
      '🧾 Hubo devolución de pedidos y te descontaron parte de caja',
    ],
  },
  programador: {
    success: [
      '💻 Cerraste un bug crítico en producción y te pagaron por emergencia',
      '🛡️ Montaste seguridad para una empresa y cobraste consultoría',
      '⚙️ Automatizaste tareas pesadas y ganaste comisión',
    ],
    fail: [
      '🐛 Subiste un parche roto y te aplicaron descuento por rollback',
      '🧯 Se cayó el servidor durante tu turno y pagaste parte del incidente',
    ],
  },
  repartidor: {
    success: [
      '🛵 Entregaste todos los pedidos antes de tiempo y hubo lluvia de propinas',
      '📦 Tomaste turnos extra nocturnos y te pagaron tarifa alta',
      '🚦 Optimizaste rutas y te dieron bonus por eficiencia',
    ],
    fail: [
      '🛞 Pinchaste llanta en plena entrega y pagaste reparación',
      '🍱 Se dañó un pedido en el camino y tocó reponerlo',
    ],
  },
  comerciante: {
    success: [
      '🛍️ Cerraste ventas grandes en cadena y cobraste comisión top',
      '💬 Negociaste precios como crack y mejoraste márgenes del día',
      '📈 Vendiste inventario rezagado y te premiaron con porcentaje',
    ],
    fail: [
      '📉 Compraste lote malo y te comiste la pérdida',
      '🧾 Hubo contracargo de clientes y te descontaron caja',
    ],
  },
};

const handler = async (m, { conn, usedPrefix }) => {
  const user = global.db.data.users[m.sender];
  ensureJobFields(user);

  const job = getJobData(user);
  if (!job) {
    return conn.reply(
      m.chat,
      `💼 No tienes chamba todavía.\n` +
        `Usa *${usedPrefix}trabajo lista* para ver empleos y *${usedPrefix}trabajo elegir <trabajo>* para empezar.`,
      m,
    );
  }

  const cooldown = 3 * 60 * 1000;
  const now = Date.now();
  if (cooldowns[m.sender] && now - cooldowns[m.sender] < cooldown) {
    const remaining = segundosAHMS(Math.ceil((cooldowns[m.sender] + cooldown - now) / 1000));
    return conn.reply(m.chat, `⏱️ Ya chambeaste hace poco, vuelve en *${remaining}*.`, m);
  }

  const premiumBoost = user.premium ? 1.25 : 1;
  const successChance = (user.premium ? 0.88 : 0.82) + Math.min(0.08, (user.jobXp || 0) / 200000);
  const ok = Math.random() < successChance;

  if (ok) {
    const amount = Math.floor((Math.random() * 36000 + 22000) * job.workMultiplier * premiumBoost);
    user.coin = (user.coin || 0) + amount;
    user.jobXp = (user.jobXp || 0) + Math.floor(amount * 0.12);
    cooldowns[m.sender] = now;
    const phrase = pickRandom(scenarios[job.key]?.success || scenarios.repartidor.success);
    return conn.reply(
      m.chat,
      `${job.emoji} *${job.name}*\n${phrase}.\n\n💸 Ganaste *${amount.toLocaleString()} ${m.moneda}*\n🧠 XP laboral: *+${Math.floor(amount * 0.12).toLocaleString()}*`,
      m,
    );
  }

  const rawLoss = Math.floor((Math.random() * 16000 + 7000) * (user.premium ? 0.9 : 1));
  const loss = Math.min((user.coin || 0) + (user.bank || 0), rawLoss);
  let rest = loss;
  const fromCoin = Math.min(user.coin || 0, rest);
  user.coin = Math.max(0, (user.coin || 0) - fromCoin);
  rest -= fromCoin;
  user.bank = Math.max(0, (user.bank || 0) - rest);

  cooldowns[m.sender] = now;
  const phrase = pickRandom(scenarios[job.key]?.fail || scenarios.repartidor.fail);
  return conn.reply(m.chat, `${job.emoji} *${job.name}*\n${phrase}.\n\n💸 Perdiste *${loss.toLocaleString()} ${m.moneda}*.`, m);
};

handler.help = ['work', 'trabajar', 'chamba'];
handler.tags = ['economy'];
handler.command = ['chamba', 'trabajar', 'w', 'work', 'chambear'];
handler.group = true;
handler.register = true;

export default handler;

function segundosAHMS(segundos) {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  return `${minutos}m ${segundosRestantes}s`;
}
