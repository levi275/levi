import { ensureJobFields, getJobData } from '../lib/rpg-jobs.js';

let cooldowns = {};

let handler = async (m, { conn, usedPrefix }) => {
  let users = global.db.data.users;
  let senderId = m.sender;
  let user = users[senderId];
  ensureJobFields(user);

  let job = getJobData(user);
  if (!job) {
    return conn.reply(m.chat, `💼 Primero consigue trabajo con *${usedPrefix}trabajo elegir <trabajo>*. Tu oficio afecta el rendimiento en #slut.`, m);
  }

  let tiempo = 5 * 60; // 5 minutos
  if (cooldowns[senderId] && Date.now() - cooldowns[senderId] < tiempo * 1000) {
    let tiempo2 = segundosAHMS(Math.ceil((cooldowns[senderId] + tiempo * 1000 - Date.now()) / 1000));
    return conn.reply(m.chat, `🥵 Ya te venís usando mucho eso we, necesitas recuperar el aliento. Vuelve en *${tiempo2}*.`, m);
  }

  let userIds = Object.keys(users).filter(u => u !== senderId && !users[u].banned);
  let targetId = userIds.length > 0 ? userIds[Math.floor(Math.random() * userIds.length)] : senderId;

  let prof = Math.min(0.08, (user.jobXp || 0) / 300000);
  let winChance = Math.min(0.87, 0.64 + (user.premium ? 0.06 : 0) + prof);
  let didWin = Math.random() < winChance;
  let useGeneric = Math.random() < 0.35; 

  cooldowns[senderId] = Date.now();
  let jobName = job.name.toUpperCase();
  let jobEmoji = job.emoji;

  if (didWin) {
    // Ganancias aumentadas (aprox 2200 a 5700)
    let amount = Math.floor((Math.random() * 3500 + 2200) * job.slutMultiplier * (user.premium ? 1.2 : 1));
    user.coin = (user.coin || 0) + amount;

    let phraseList = useGeneric ? frasesSlutGenericas.success : (frasesSlutPorTrabajo[job.key]?.success || frasesSlutGenericas.success);
    let phrase = pickRandom(phraseList);

    let texto = `❪❨̶  ֶָ֢ ✻̸ ${phrase} con @${targetId.split('@')[0]}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐚𝐠𝐨: *${toNum(amount)}* ( *${amount}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.sendMessage(m.chat, { text: texto, contextInfo: { mentionedJid: [targetId] } }, { quoted: m });
  }

  // Pérdidas reducidas (aprox 300 a 1000)
  let amountLoss = Math.floor((Math.random() * 700 + 300) * job.slutLossMultiplier);
  let loss = Math.min((user.coin || 0) + (user.bank || 0), amountLoss);
  let rest = loss;
  let fromCoin = Math.min(user.coin || 0, rest);
  user.coin = Math.max(0, (user.coin || 0) - fromCoin);
  rest -= fromCoin;
  user.bank = Math.max(0, (user.bank || 0) - rest);

  let phraseList = useGeneric ? frasesSlutGenericas.fail : (frasesSlutPorTrabajo[job.key]?.fail || frasesSlutGenericas.fail);
  let phrase = pickRandom(phraseList);

  let textoLoss = `❪❨̶  ֶָ֢ ✻̸ ${phrase} ahuyentaste a @${targetId.split('@')[0]}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐞𝐫𝐝𝐢𝐬𝐭𝐞: *${toNum(loss)}* ( *${loss}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜  ⬫`;
  return conn.sendMessage(m.chat, { text: textoLoss, contextInfo: { mentionedJid: [targetId] } }, { quoted: m });
};

handler.help = ['slut'];
handler.tags = ['economy'];
handler.command = ['slut', 'prostituirse'];
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

const frasesSlutGenericas = {
  success: [
    "Le agarraste la onda y lo dejaste temblando de placer",
    "Le diste una nalgada que gritó 'ay papi/mami' y te premió",
    "Le hiciste el gawk gawk 3000 sin piedad y quedó mudo",
    "Usaste las dos manos y la boca a la vez, el cliente facturó doble",
    "Le rebotaste encima como lavadora en centrifugado",
    "Le hiciste un baile sucio en plena calle y te llovieron billetes",
    "Te pusiste en 4 y no dudaron en dejarte propina pesada",
    "Le lambiste el ombligo sin que lo pidiera y le despertaste fetiches",
    "Te dejaron amarrado a una silla, te gustó y cobraste extra",
    "Te grabaron haciendo cosas raras, se hizo viral en OnlyFans",
    "Hiciste un rapidín en el baño del antro y cobraste el cover",
    "Le hiciste el helicóptero acrobático y le volaste la mente",
    "Te disfrazaste de monja rebelde y vaciaste su cartera",
    "Hiciste la mortal hacia atrás y caíste justo donde debías",
    "Cobraste tarifa Premium por dejarte ahorcar poquito",
    "Te metiste al jacuzzi juntos y el agua se puso a hervir de la pasión"
  ],
  fail: [
    "Le mordiste donde no debías sin querer y te demandaron",
    "El cliente te vomitó encima del asco, qué asquerosidad",
    "Te resbalaste, caíste encima de la mesa y te tocó pagar",
    "No te bañaste, olías a patas y te cancelaron el servicio",
    "Le hablaste de tu ex en pleno acto y se le bajó todo",
    "Te cayó redada policiaca y soltaste plata para salir",
    "Te topaste a un cliente tóxico que no pagó y robó tu cel",
    "Se te acalambró la pierna a medio acto y fuiste a urgencias"
  ]
};

const frasesSlutPorTrabajo = {
  albañil: {
    success: [
      "Llegaste marcado de cemento y eso prendió a tu cliente con fetiches",
      "Le diste como maestro de obra: a puros martillazos y albures",
      "Sudado y con pala en mano le cumpliste su fantasía de 'obrero rudo'",
      "Armaste un rapidín en los andamios a 15 metros, pura adrenalina",
      "Usaste el nivelador para asegurarte que le estabas dando derecho",
      "Te quitaste el chaleco reflejante bailando lento y cobraste caro",
      "Lo empotraste contra el muro de tabique que acababas de levantar",
      "Rellenaste sus grietas con tu mezcla especial y te dio propina"
    ],
    fail: [
      "Tenías cal en las manos y le raspaste las partes nobles",
      "El chaleco reflejante cortó el mood y te corrieron",
      "Te cayó mezcla fresca en un lugar sensible y lloraste",
      "Tus manos estaban tan rasposas que le dejaste marcas y te corrió"
    ]
  },
  basurero: {
    success: [
      "Te disfrazaste de mapache y le cumpliste su fantasía salvaje",
      "Tu actitud de barrio pesado encantó y cerraste trato atrás del camión",
      "Le hiciste el 'reciclaje profundo' y le sacaste los ahorros",
      "Limpiaste sus tuberías mejor que las calles de la colonia",
      "Lo compactaste contra la pared del cuarto y te pagó triple",
      "Usaste guantes gruesos de látex y despertaste un fetiche raro",
      "Separaste su ropa como si fuera PET y terminaron sin nada",
      "Cobraste tarifa alta por recoger su 'basurita' emocional y física"
    ],
    fail: [
      "Olías a lixiviado de 3 días y perdiste al cliente al instante",
      "Una bolsa de basura rota te arruinó la lencería cara",
      "Encontró una cáscara de plátano pegada a tu zapato y se asqueó",
      "Le dio alergia el polvo del camión que traías encima"
    ]
  },
  chef: {
    success: [
      "Usaste crema batida de formas creativas y cobraste premium",
      "Le serviste la cena sobre tu cuerpo y se comió todo el menú",
      "Usaste el rodillo de amasar para darle unos golpecitos que le encantaron",
      "Tus habilidades con la lengua probando caldos sirvieron para otras cosas",
      "Le hiciste un glaseado especial y te dio calificación Michelin",
      "Cocinaron juntos sin ropa y la temperatura de la cocina subió al máximo",
      "Le diste a probar de tu 'salsa secreta' y se volvió adicto",
      "Usaste hielos y chocolate caliente para volverlo loco"
    ],
    fail: [
      "Le pusiste salsa habanera donde no iba y le ardió el alma",
      "Se te quemó la cena romántica previa y el humo arruinó todo",
      "Olías a cebolla y ajo intensamente, no aguantó el beso",
      "Agarraste el chile serrano antes de tocarlo y terminaron en el hospital"
    ]
  },
  programador: {
    success: [
      "Le montaste un show en VR y te pagaron en Bitcoin",
      "Hiciste un juego de rol de 'Hackeando tu corazón' y le derretiste el firewall",
      "Tecleaste comandos mientras le dabas placer y le cumpliste su fantasía nerd",
      "Vendiste el agua de tu teclado por cientos de dólares",
      "Ejecutaste el script 'placer.exe' en bucle infinito y facturaste",
      "Vestiste de colegiala anime y los donadores de Twitch enloquecieron",
      "Insertaste tu código en su backend sin errores y te dio 5 estrellas",
      "Bypasseaste sus defensas y entraste hasta el mainframe"
    ],
    fail: [
      "Se te cayó el internet a medio cam-show y perdiste los tips",
      "Tu mamá entró al cuarto en pleno stream y tuviste que huir",
      "Te dio síndrome del túnel carpiano en plena chaqueta y no acabaste",
      "Te hackearon a ti en medio del acto y te vaciaron la cuenta"
    ]
  },
  repartidor: {
    success: [
      "Te pidieron 'paquete completo' en la app y cobraste los extras",
      "Usaste la mochila térmica para calentar los ánimos",
      "Hiciste 'delivery de salchicha' y te dieron 5 estrellas",
      "Lo hicieron rapidín en las escaleras antes del siguiente pedido",
      "Llegaste empapado por la lluvia y eso le prendió muchísimo al cliente",
      "Le entregaste la pizza y de paso le diste su rebanada especial",
      "Manejaste tu moto directo hasta su cuarto y armaron el desmadre",
      "Aceleraste en la cama como aceleras en los semáforos, pura velocidad"
    ],
    fail: [
      "Te descubrió el conserje en plena acción y te multaron",
      "La moto se cayó con todo y pedidos por estar adentro perdiendo el tiempo",
      "Llegaste frío, tarde y sudando feo, te reportaron",
      "El cliente te robó la moto mientras te quitabas la ropa"
    ]
  },
  comerciante: {
    success: [
      "Regateaste tu cuerpo y cerraste una noche redonda carísima",
      "Con puro verbo subiste el precio de la hora y te pagaron todo",
      "Ofreciste promo de 'Pague 1 lleve 2' con tu compa y rompieron récords",
      "Vendiste tu ropa interior usada al triple de su valor original",
      "Aplicaste tácticas de marketing en la cama y quedó fidelizado",
      "Lo convenciste de suscribirse a tu plan mensual de cariño",
      "Le cobraste hasta el impuesto por respirar tu mismo aire",
      "Vendiste la experiencia como un producto de Apple: cara y exclusiva"
    ],
    fail: [
      "Tu terminal falló justo antes de cobrar y el cliente huyó sin pagar",
      "Invertiste en lencería pirata, se rompió al primer tirón y pasaste pena",
      "Le vendiste un servicio sobrevalorado y te quemó en redes sociales",
      "No aceptabas transferencias, no traía efectivo y perdiste el rato"
    ]
  }
};