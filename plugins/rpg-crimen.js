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

    // AQUI USAMOS LA LISTA "JAIL" EN LUGAR DE "FAIL"
    let phraseList = useGeneric ? frasesCrimenGenericas.jail : (frasesCrimenPorTrabajo[job.key]?.jail || frasesCrimenGenericas.jail);
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
    "Le ponchaste la llanta a un carro para robarlo mientras lo arreglaban",
    "Hackeaste el WiFi del vecino y de paso le vaciaste el PayPal",
    "Te metiste de noche a una escuela y te llevaste hasta las computadoras viejas",
    "Falsificaste un boleto de lotería ganador y lo cobraste",
    "Te hiciste pasar por inspector de salubridad y cobraste sobornos"
  ],
  fail: [ // Aquí solo pierdes dinero (multas, sobornos, te asaltan a ti, etc.)
    "Una doña te agarró a escobazos, huiste pero se te cayeron las monedas del bolsillo",
    "Te tropezaste huyendo del perro de la calle y soltaste la cartera",
    "Un cholo más grande que tú te asaltó mientras tú intentabas asaltar a otro",
    "La patrulla te paró por sospechoso y tuviste que soltar mordida para que te dejaran ir",
    "Intentaste robar una máquina expendedora, se te cayó encima y pagaste el hospital",
    "Un transeúnte resultó ser peleador de MMA, te dio una paliza y te quitó tu dinero",
    "Se te rompió la mochila en la huida y fuiste dejando billetes por toda la calle",
    "Te estafaron al intentar comprar herramientas para tu próximo gran golpe",
    "Te metiste a robar una casa pero era la de un narco, pagaste por tu vida",
    "Fingiste ser vidente para robar, pero te demandaron por fraude y pagaste arreglo",
    "Perdiste una apuesta clandestina tratando de duplicar lo robado ayer"
  ],
  jail: [ // Aquí SI vas a la cárcel (16 minutos preso)
    "Te cazaron las cámaras de vigilancia en pleno acto y llegaron los SWAT por ti",
    "La policía te agarró corriendo con la tele en la mano, directo a los separos",
    "Te descubrieron los vecinos, te amarraron a un poste y llamaron a la patrulla",
    "Te agarraron los tombos infraganti y te metieron la macana antes de esposarte",
    "El juez no te creyó el cuento de 'yo no fui' y te mandó pa' adentro",
    "Intentaste sobornar al policía equivocado y te sumó cargos por corrupción",
    "Te atoraste en la ventana intentando escapar y los bomberos te entregaron a la ley",
    "Tu cómplice te traicionó, te dejó tirado y la jura te levantó",
    "Te quedaste dormido en la casa que estabas robando, los dueños llamaron al 911",
    "Te pararon en un retén y traías el maletero lleno de cosas robadas"
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
      "Robaste los planos originales, los vendiste a la competencia",
      "Hiciste un cuartito oculto en la obra para guardar material robado",
      "Le dijiste al patrón que faltaba arena y te embolsaste el dinero de la compra"
    ],
    fail: [
      "Te descubrió el eléctrico robándole, te dio un puñetazo y te quitó dinero en compensación",
      "La barda mal hecha que usaste de escondite se cayó, pagaste los daños materiales",
      "Te estafaron en el fierro viejo pagándote con billetes falsos por tu cobre",
      "Rompiste un tubo de agua intentando robar una válvula, el patrón te descontó",
      "Apostaste el dinero del cemento robado en las maquinitas y lo perdiste todo"
    ],
    jail: [
      "El arquitecto revisó las cámaras, vio cómo te llevabas la mezcladora y llamó a la ley",
      "Te torcieron vendiendo cemento robado en Facebook Marketplace y hubo operativo",
      "La constructora hizo auditoría sorpresa, encontraron tu bodega ilegal y vas preso",
      "Te cayó una inspección federal justo cuando subías varillas a tu camioneta"
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
      "Desmantelaste un carro chocado en la calle antes de que llegara la grúa",
      "Encontraste cheques al portador traspapelados y los cobraste con identidad falsa",
      "Te robaste las baterías de los semáforos de tu ruta"
    ],
    fail: [
      "Un vagabundo territorial te dio una paliza por robar en su contenedor y te quitó dinero",
      "Trataste de robar un retrovisor, rompiste el vidrio y tuviste que huir soltando billetes",
      "Extorsionaste a la persona equivocada, sus guaruras te interceptaron y te vaciaron las bolsas",
      "Compraste herramientas para abrir contenedores blindados pero no funcionaron (pérdida de inversión)",
      "Te mordió un perro guardián mientras robabas chatarra, la vacuna te costó una fortuna"
    ],
    jail: [
      "Te atraparon robando cableado de alta tensión disfrazado con el uniforme",
      "Una cámara te grabó rompiendo la ventana de una mansión desde el camión, directo al MP",
      "La dueña del perro que te robaste rastreó el AirTag y llegó la policía a tu casa",
      "Los federales te interceptaron usando el camión de basura para mover contrabando"
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
      "Metiste a tus amigos gratis por la puerta de atrás y te pagaron a ti",
      "Te llevaste los cubiertos de plata fina del restaurante de a poquito",
      "Clonaste las tarjetas de los comensales ricachones"
    ],
    fail: [
      "Un cliente notó que le cobraste doble, hizo un escándalo y tuviste que indemnizarlo de tu bolsa",
      "Te robaste caviar pero se echó a perder en tu mochila, perdiste clientes del mercado negro",
      "Rompiste tres botellas de vino carísimo intentando esconderlas y el gerente te las cobró",
      "Te asaltaron en el callejón trasero justo cuando salías con la carne robada",
      "Trataste de lavar dinero en el restaurante pero te equivocaste en las cuentas y perdiste saldo"
    ],
    jail: [
      "El dueño te agarró infraganti falsificando facturas y llamó a las autoridades",
      "Intoxicaste a medio restaurante usando carne robada y caducada, vas pa'l bote",
      "La policía cibernética rastreó las tarjetas clonadas hasta la cocina y te esposaron",
      "Hiciste contrabando de sustancias ilícitas dentro de las ollas express y te torcieron"
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
      "Clonaste el código fuente de tu patrón y lo vendiste a los chinos",
      "Burlaste el pago de Netflix y vendiste cuentas piratas por cientos de dólares",
      "Hackeaste los parquímetros del centro y redirigiste los pagos a tu PayPal"
    ],
    fail: [
      "Pagaste por un exploit en la dark web que resultó ser una estafa, perdiste tu dinero",
      "Tu propio ransomware se activó en tu PC y tuviste que pagar para rescatar tus fotos",
      "Un hacker ruso descubrió tu IP y te vació tu cuenta de banco personal",
      "Invertiste lo robado en una Shitcoin y se fue a cero en 10 minutos",
      "Rompiste tu tarjeta de video minando ilegalmente y reponerla te salió carísimo"
    ],
    jail: [
      "El FBI rastreó tu IP sin VPN mientras hackeabas un banco y tumbaron tu puerta",
      "La policía cibernética interceptó tus ventas de bases de datos y te cayeron de madrugada",
      "Te denunció la señora a la que le hiciste phishing y la fiscalía te procesó",
      "El sistema de seguridad de la empresa te trianguló y llamaron a los federales"
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
      "Le robaste el perro al cliente que no quiso darte propina",
      "Fingiste que no llegó el pedido de despensa y llenaste tu alacena",
      "Te quedaste con el cambio diciendo que no traías monedas sueltas"
    ],
    fail: [
      "Le intentaste robar a un cliente que resultó ser malandro, te dio unos tablazos y te quitó dinero",
      "Fingiste un asalto pero arruinaste la moto tú mismo, arreglarla te salió el triple",
      "Te estafaron comprando terminales falsas que no funcionaban",
      "Huiste muy rápido tras robar el paquete y la cámara de fotomulta te cobró una fortuna",
      "El perro que robaste rompió los muebles de tu casa y te salió carísimo"
    ],
    jail: [
      "El cliente abrió el paquete del iPhone frente a ti, vio el ladrillo y llamó a la patrulla",
      "Te atraparon en un retén transportando 'mercancía especial' entre las alitas",
      "El GPS del paquete de Amazon te delató y la policía te encontró en tu guarida",
      "La app te denunció por fraude reiterado y la fiscalía giró orden de aprehensión"
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
      "Compraste robado a mitad de precio y vendiste como nuevo",
      "Adulteraste la báscula y le cobraste un 20% extra a todos los clientes del mes",
      "Te declaraste en quiebra falsa para no pagar deudas pero mantuviste los activos"
    ],
    fail: [
      "Los proveedores a los que estafaste mandaron cobradores pesados y tuviste que pagarles el doble",
      "Un lote de tu mercancía pirata venía defectuoso, tuviste que reembolsar dinero por la fuerza",
      "Intentaste sobornar a un inspector de salubridad corrupto que te exprimió casi todas tus ganancias",
      "Contrataste mercenarios para amedrentar a la competencia y se fugaron con tu anticipo",
      "Tus socios descubrieron la fuga de capital y te demandaron por lo civil quitándote una buena suma"
    ],
    jail: [
      "El SAT descubrió tus facturas falsas y te acusaron formalmente de evasión fiscal agravada",
      "Vendiste piratería descarada, cayeron los representantes de la marca original y terminaste preso",
      "La policía financiera desmanteló tu red de lavado de dinero en tu local 'legítimo'",
      "Estafaste a la abuelita equivocada (era madre del comisario) y te hundieron en la cárcel"
    ]
  }
};