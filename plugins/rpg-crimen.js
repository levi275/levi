import { ensureJobFields, getJobData } from '../lib/rpg-jobs.js';

let cooldowns = {};
let jail = {};

let handler = async (m, { conn, usedPrefix }) => {
  let users = global.db.data.users;
  let senderId = m.sender;
  let user = users[senderId];
  ensureJobFields(user);

  let job = getJobData(user);
  if (!job) {
    return conn.reply(m.chat, `💼 No tienes trabajo. Busca uno con *${usedPrefix}trabajo elegir <trabajo>* para desbloquear #crime.`, m);
  }

  let cooldown = 8 * 60; // 8 mins
  let jailCooldown = 16 * 60; // 16 mins
  let now = Date.now();

  if (jail[senderId] && now < jail[senderId]) {
    let remaining = segundosAHMS(Math.ceil((jail[senderId] - now) / 1000));
    return conn.reply(m.chat, `🚔 Sigues en la cárcel mijo. Te faltan *${remaining}* para volver a ver la luz del sol.`, m);
  }

  if (cooldowns[senderId] && now - cooldowns[senderId] < cooldown * 1000) {
    let remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown * 1000 - now) / 1000));
    return conn.reply(m.chat, `🚨 La zona está caliente, espera *${remaining}* pa no caer preso we.`, m);
  }

  let skill = Math.min(0.07, (user.jobXp || 0) / 300000);
  let jailChance = Math.max(0.04, (user.premium ? 0.09 : 0.13) - (job.crimeSuccessBonus * 0.4) - (skill * 0.5));
  let successChance = Math.min(0.86, (user.premium ? 0.6 : 0.5) + job.crimeSuccessBonus + skill);
  let roll = Math.random();
  let useGeneric = Math.random() < 0.35; 

  let jobName = job.name.toUpperCase();
  let jobEmoji = job.emoji;

  if (roll < jailChance) {
    jail[senderId] = now + (jailCooldown * 1000);
    cooldowns[senderId] = now;

    let phraseList = useGeneric ? frasesCrimenGenericas.fail : (frasesCrimenPorTrabajo[job.key]?.fail || frasesCrimenGenericas.fail);
    let phrase = pickRandom(phraseList);

    let textoJail = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐂𝐨𝐧𝐝𝐞𝐧𝐚: *16 Minutos Preso*\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.reply(m.chat, textoJail, m);
  }

  if (roll < jailChance + successChance) {
    // Ganancias aumentadas (aprox 3000 a 7500)
    let amount = Math.floor((Math.random() * 4500 + 3000) * job.crimeRewardMultiplier * (user.premium ? 1.18 : 1));
    user.coin = (user.coin || 0) + amount;
    cooldowns[senderId] = now;

    let phraseList = useGeneric ? frasesCrimenGenericas.success : (frasesCrimenPorTrabajo[job.key]?.success || frasesCrimenGenericas.success);
    let phrase = pickRandom(phraseList);

    let texto = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐁𝐨𝐭𝐢́𝐧: *${toNum(amount)}* ( *${amount}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.reply(m.chat, texto, m);
  }

  // Pérdidas reducidas (aprox 500 a 1500)
  let amountLoss = Math.floor((Math.random() * 1000 + 500) * (user.premium ? 0.85 : 1));
  let loss = Math.min(Math.floor((user.coin || 0) * 0.55), amountLoss);
  user.coin = Math.max(0, (user.coin || 0) - loss);
  cooldowns[senderId] = now;

  let phraseList = useGeneric ? frasesCrimenGenericas.fail : (frasesCrimenPorTrabajo[job.key]?.fail || frasesCrimenGenericas.fail);
  let phrase = pickRandom(phraseList);

  let textoLoss = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐞𝐫𝐝𝐢𝐬𝐭𝐞: *${toNum(loss)}* ( *${loss}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
  return conn.reply(m.chat, textoLoss, m);
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

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())];
}

// ==========================================
// ARRAYS DE FRASES - CRIMEN
// ==========================================
const frasesCrimenGenericas = {
  success: [
    "Le cagaste la vida a un transeúnte y le arrebataste todo",
    "Con un machetazo y un buen susto le quitaste la cartera a un fresa",
    "Le metiste una trompada a un despistado y le sacaste su quincena",
    "Le diste piso a un rival y te robaste su botín, qué perrote",
    "Desvalijaste una casa como capo y te pelaste por la ventana",
    "Atracaste en la esquina oscura y saliste con los bolsillos llenos",
    "Le explotaste la cartera a un oficinista y te largaste corriendo",
    "El del Oxxo no supo ni qué pedo y ya le habías vaciado la caja",
    "Lo agarraste de pendejo en el metro y le tumbaste el celular",
    "Usaste pasamontañas y asaltaste la combi con éxito",
    "Le hiciste el pase mágico al señor del mercado y lo dejaste en ceros",
    "Clonaste 5 tarjetas en el cajero automático del centro",
    "Robaste espejos de carros en el estacionamiento y los vendiste",
    "Extorsionaste a un morrito por WhatsApp y te depositó",
    "Le arrancaste la cadena de oro a un mirrey y corriste",
    "Le ponchaste la llanta a un carro para robarlo mientras lo arreglaban"
  ],
  fail: [
    "Te cazaron en pleno acto y te quietaron todo por mamón",
    "La policía te agarró corriendo y te quitaron tu botín, qué sad",
    "Te descubrieron los vecinos y te lincharon, rata torpe",
    "Te agarraron los tombos y te metieron la macana por andar robando",
    "La jura te tundió duro y te volaron hasta los tenis",
    "Te cacharon en cámara de seguridad y te reventaron la puerta",
    "Saliste pa'l hospital después de que la doña te agarrara a escobazos",
    "Te tropezaste huyendo del perro y los puercos te agarraron",
    "Llegó la patrulla en silencio y te bajaron con todo"
  ]
};

const frasesCrimenPorTrabajo = {
  albañil: {
    success: [
      "Te robaste 20 kilos de cobre de la construcción y coronaste",
      "Vendiste costales de cemento por fuera y dijiste que se mojaron",
      "Le cobraste doble al cliente por materiales fantasma",
      "Mientras hacías relleno en la obra, le tumbaste monedas al jefe",
      "Escondiste varillas en tu mochila, saliste normal y las vendiste",
      "Le vaciaste la caja de herramientas al eléctrico mientras no veía",
      "Sobornaste al velador para llevarte 3 botes de pintura cara",
      "Robaste los planos originales, los vendiste a la competencia"
    ],
    fail: [
      "Te vieron en la bodega metiendo varillas a tu pantalón",
      "El arqui te cachó robando arena y te cayó la ley",
      "Se cayó la barda mal hecha con la que intentabas robar material",
      "Te revisaron la mochila a la salida y te encontraron el martillo del patrón"
    ]
  },
  basurero: {
    success: [
      "Encontraste una cartera gorda en la basura y vaciaste las tarjetas",
      "Vendiste secretos corporativos que encontraste triturados a medias",
      "Te metiste a una casa rica 'buscando cartón' y saliste con joyas",
      "Le robaste los tapones a los carros mientras el camión avanzaba lento",
      "Extorsionaste a una señora con fotos embarazosas que tiró",
      "Te robaste un perro de raza disfrazado entre bolsas de basura",
      "Cobraste cuota de mafia para llevarte la basura del mercado",
      "Desmantelaste un carro chocado en la calle antes de que llegara la grúa"
    ],
    fail: [
      "Una cámara del camión te grabó robando los botes de la calle",
      "El dueño de la casa soltó a los perros mientras esculcabas",
      "Te cortaste con vidrios rotos al robar un anillo y dejaste tu sangre",
      "Te atraparon robando cableado disfrazado de basurero"
    ]
  },
  chef: {
    success: [
      "Te robaste los cortes de carne y las trufas para el mercado negro",
      "Cargaste cuentas falsas a clientes borrachos y te guardaste el efectivo",
      "Diluiste los licores caros y vendiste las botellas originales",
      "Distrajiste al gerente y vaciaste la caja chica de propinas",
      "Revendiste los ingredientes orgánicos del jefe a la mitad de precio",
      "Le escupiste a la sopa de tu enemigo y además le cobraste propina",
      "Falsificaste facturas de verdura y te clavaste la diferencia",
      "Metiste a tus amigos gratis por la puerta de atrás y te pagaron a ti"
    ],
    fail: [
      "Te cacharon manipulando caja del restaurante y te echaron a los puercos",
      "El gerente notó que faltaba inventario de langostas y te denunció",
      "Te envenenaste tú mismo tratando de robar el caviar caducado",
      "Salubridad descubrió tu rata asada ilegal y clausuraron el lugar"
    ]
  },
  programador: {
    success: [
      "Infiltraste una wallet vieja y sacaste saldo sin dejar rastro",
      "Metiste un ransomware a una empresa y cobraste el rescate en criptos",
      "Vendiste la base de datos de los clientes en la dark web",
      "Programaste un troyano en el juego de moda y robaste cuentas",
      "Desviaste los centavos de nómina a tu cuenta, estilo película",
      "Hiciste phishing a señoras del Facebook y les vaciaste la pensión",
      "Mineraste Bitcoin usando los servidores de la empresa en secreto",
      "Clonaste el código fuente de tu patrón y lo vendiste a los chinos"
    ],
    fail: [
      "Te rastrearon por un endpoint mal cubierto y te cayó la ciberpolicía",
      "Intentaste hackear al SAT y terminaste con tus cuentas congeladas",
      "Tu propio malware infectó tu PC y perdiste todas tus criptomonedas",
      "Dejaste tu IP pública expuesta y el FBI tiró la puerta de tu cuarto"
    ]
  },
  repartidor: {
    success: [
      "Cambiaste un iPhone por un ladrillo en la caja y te quedaste el celular",
      "Simulaste asalto, te comiste el sushi y cobraste el seguro",
      "Clonaste las tarjetas de los clientes con una terminal falsa",
      "Vendiste cuentas premium robadas de delivery en grupos de Telegram",
      "Interceptaste paquetes de Amazon y armaste tu tianguis ilegal",
      "Cobraste doble un pedido usando la confusión de la app",
      "Repartiste mercancía ilegal escondida entre las pizzas",
      "Le robaste el perro al cliente que no quiso darte propina"
    ],
    fail: [
      "El cliente te grabó comiéndote sus papas y la app te entregó a la policía",
      "Fingiste un asalto pero la zona tenía cámaras HD, vas pa' adentro",
      "Te torcieron vendiendo mercancía robada en Marketplace",
      "El GPS de la mochila robada guió a la patrulla hasta tu casa"
    ]
  },
  comerciante: {
    success: [
      "Vendiste productos caducados cambiándoles la etiqueta y cobraste caro",
      "Hiciste fraude fiscal maestro y el SAT ni se dio cuenta",
      "Estafaste a tus proveedores con cheques sin fondo y huiste con la lana",
      "Clonaste la mercancía de marca y la pasaste por original",
      "Robaste a tus socios empresariales inventando un hackeo falso",
      "Vendiste seguros de vida falsos a viejitos asustados",
      "Evadiste impuestos lavando dinero por tu negocio 'legítimo'",
      "Compraste robado a mitad de precio y vendiste como nuevo"
    ],
    fail: [
      "Te cayó Profeco por estafador, te multaron y te quitaron el negocio",
      "El SAT congeló tus cuentas por lavado y te metió al bote",
      "Tus socios descubrieron la estafa y te mandaron a los cobradores",
      "Vendiste piratería y la marca original te demandó hasta dejarte sin nada"
    ]
  }
};