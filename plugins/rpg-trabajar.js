import { ensureJobFields, getJobData } from '../lib/rpg-jobs.js';

let cooldowns = {};

let handler = async (m, { conn, usedPrefix }) => {
  let user = global.db.data.users[m.sender];
  ensureJobFields(user);

  let job = getJobData(user);
  if (!job) {
    return conn.reply(m.chat, `💼 No tienes chamba todavía rey.\nUsa *${usedPrefix}trabajo lista* para ver empleos y *${usedPrefix}trabajo elegir <trabajo>* para empezar a facturar.`, m);
  }

  let tiempo = 3 * 60; // 3 minutos
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempo * 1000) {
    let tiempo2 = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempo * 1000 - Date.now()) / 1000));
    return conn.reply(m.chat, `✧ Ya chambeaste hace rato we, descansa la espalda. Vuelve en *${tiempo2}*.`, m);
  }

  let premiumBoost = user.premium ? 1.2 : 1;
  let successChance = (user.premium ? 0.88 : 0.82) + Math.min(0.08, (user.jobXp || 0) / 200000);
  let ok = Math.random() < successChance;
  let useGeneric = Math.random() < 0.35; // 35% de que salga situación genérica

  cooldowns[m.sender] = Date.now();

  let jobName = job.name.toUpperCase();
  let jobEmoji = job.emoji;

  if (ok) {
    // Ganancias aumentadas (aprox 2000 a 5000)
    let amount = Math.floor((Math.random() * 3000 + 2000) * job.workMultiplier * premiumBoost);
    let xpEarned = Math.floor(amount * 0.15);
    user.coin = (user.coin || 0) + amount;
    user.jobXp = (user.jobXp || 0) + xpEarned;

    let phraseList = useGeneric ? frasesGenericas.success : (frasesPorTrabajo[job.key]?.success || frasesGenericas.success);
    let phrase = pickRandom(phraseList);

    let texto = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐆𝐚𝐧𝐚𝐬𝐭𝐞: *${toNum(amount)}* ( *${amount}* ) ${m.moneda}\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐗𝐏: *+${xpEarned}*\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.reply(m.chat, texto, m);
  }

  // Pérdidas reducidas (aprox 200 a 600)
  let rawLoss = Math.floor((Math.random() * 400 + 200) * (user.premium ? 0.9 : 1));
  let loss = Math.min((user.coin || 0) + (user.bank || 0), rawLoss);
  let rest = loss;
  let fromCoin = Math.min(user.coin || 0, rest);
  user.coin = Math.max(0, (user.coin || 0) - fromCoin);
  rest -= fromCoin;
  user.bank = Math.max(0, (user.bank || 0) - rest);

  let phraseList = useGeneric ? frasesGenericas.fail : (frasesPorTrabajo[job.key]?.fail || frasesGenericas.fail);
  let phrase = pickRandom(phraseList);

  let textoLoss = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐞𝐫𝐝𝐢𝐬𝐭𝐞: *${toNum(loss)}* ( *${loss}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
  return conn.reply(m.chat, textoLoss, m);
};

handler.help = ['work'];
handler.tags = ['economy'];
handler.command = ['chamba', 'trabajar', 'w', 'work', 'chambear'];
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

const frasesGenericas = {
  success: [
    "Le arreglaste el WiFi a una doña y te pagó",
    "Hiciste delivery en tu bici y te ganaste algo extra",
    "Vendiste empanadas en la esquina y conseguiste varo",
    "Ayudaste a un ciego a cruzar la calle y te dio recompensa",
    "Te disfrazaste de bot y entretuviste a la mara, te soltaron",
    "Chambeaste como DJ en una fiesta barata y te pagaron",
    "Le limpiaste el celular a un señor con el dedo y te dio propina",
    "Trabajaste de cuidador de gatos y te dieron lana",
    "Ayudaste a hackear una tarea y el alumno te soltó",
    "Vendiste stickers en el grupo y ganaste por comisiones",
    "Hiciste freelance programando scripts simples y te pagaron",
    "Le hiciste la intro en CapCut a un youtuber y te dio dinero",
    "Fuiste al mercado a ayudar con las bolsas y te llovió feria",
    "Actuaste como NPC en una app de IA y cobraste la hora",
    "Te disfrazaste de Pikachu en la plaza y te tiraron monedas",
    "Fuiste plomero por un día y cobraste el arreglo",
    "Hiciste pasteles con tu abuela y te tocó parte de la venta",
    "Le arreglaste el WhatsApp a una señora y te soltó",
    "Hiciste memes virales y cobraste por la fama en Twitter",
    "Reparaste consolas retro y sacaste buena ganancia",
    "Enseñaste a un niño a jugar Minecraft y sus papás te dieron"
  ],
  fail: [
    "Rompiste la pantalla del celular que intentabas reparar y te lo cobraron a lo triple",
    "Te dormiste en el camión, llegaste tarde y te descontaron medio día",
    "Le respondiste mal al cliente Karen de turno y te bajaron el sueldo por penalización",
    "Te resbalaste trapeando, rompiste una vitrina y la tuviste que pagar",
    "Te fuiste de pinta, te descubrió tu jefe y te quitó el bono de puntualidad",
    "Hiciste mal el corte de caja y tuviste que poner de tu bolsa para cuadrar",
    "Fuiste por las cocas de los de la oficina, te asaltaron y pusiste tú el dinero",
    "Daños a equipo de la empresa por andar jugando a las carreritas, adiós nómina",
    "Tiraste pintura sobre la alfombra nueva del corporativo, cobro directo a ti",
    "Perdiste las llaves del almacén, te cobraron el cerrajero y los candados nuevos"
  ]
};

const frasesPorTrabajo = {
  albañil: {
    success: [
      "Levantaste una pared a puro ojo y te quedó derechita, el Inge te premió",
      "Colaste el techo tú solo bajo el sol y te dieron bono extra",
      "Pegaste tabiques a la velocidad de la luz y acabaste el jale temprano",
      "Preparaste la mezcla perfecta, ni muy aguada ni muy seca, y te pagaron bien",
      "Cargaste 4 bultos de cemento juntos, impresionaste al patrón y te soltó feria",
      "Armaste el andamio sin que se tambalee y cobraste seguro",
      "Hiciste la instalación eléctrica de volada y sacaste propina",
      "Encontraste varilla vieja, la vendiste al fierro viejo y sumaste ganancia",
      "El dueño te invitó las caguamas y encima te pagó tu jornada completa",
      "Tiraste un muro viejo a puro marrazo y cobraste demolición"
    ],
    fail: [
      "Pusiste el muro chueco, lo tuvieron que tirar y te cobraron los ladrillos rotos",
      "Dejaste mal fraguar el concreto y te obligaron a comprar más materiales de tu dinero",
      "Rompiste la carretilla nueva por aventarla como loco, te descontaron en la raya",
      "Perforaste un tubo principal de agua sin querer, el plomero te cobró a ti el arreglo",
      "Mediste mal el terreno y colaste donde no era, multa tremenda del arquitecto"
    ]
  },
  basurero: {
    success: [
      "Encontraste una tele medio funcional, la vendiste y sacaste buen extra",
      "Separaste el PET y las latas como campeón y el kilo estaba caro hoy",
      "Manejaste el camión como Toretto por el barrio y terminaste temprano",
      "Limpiaste el desastre después del tianguis y los vecinos armaron coperacha",
      "Te dieron propina en una residencial por llevarte sus escombros",
      "Rescataste una silla gamer de la basura, la limpiaste y la vendiste",
      "Hiciste tu ruta sin chocar ningún retrovisor y te dieron bono",
      "Recolectaste toda la chatarra de un taller y te pagaron pesado",
      "Le ganaste a los perros callejeros por una bolsa valiosa",
      "Cumpliste doble turno porque faltó el chofer y cobraste doble"
    ],
    fail: [
      "Chocaste el camión contra un carro estacionado, te cobraron el deducible entero",
      "Se te cayó un sillón encima de un coche y rompiste el parabrisas, te descontaron",
      "Te multó el municipio por tirar lixiviados en zona prohibida",
      "Un perro te mordió fuerte, fuiste al doctor privado y te costó media quincena",
      "Rompiste los guantes y el equipo de seguridad de la empresa, te los cobraron nuevos"
    ]
  },
  chef: {
    success: [
      "Te aventaste un menú gourmet con sobras y los clientes dejaron propinota",
      "Hiciste un emplatado tan mamador que te pagaron extra por el arte",
      "Sacaste 50 pedidos en hora pico sin quemar nada y te dieron bono",
      "Tu sazón hizo llorar de alegría al gerente y te subió la tarifa",
      "Hiciste un pastel de tres pisos que no se derrumbó y cobraste caro",
      "El TikToker de comida probó tus tacos y te dejó buena propina",
      "Salvaste la sopa que estaba salada poniéndole papas, cobraste igual",
      "Cocinaste para un evento VIP y te forraste de dinero",
      "Despellejaste el pescado a la velocidad de la luz",
      "Inventaste una salsa nueva que se vendió como pan caliente"
    ],
    fail: [
      "Quemaste 10 kilos de cortes de carne fina, el dueño te los descontó a precio de carta",
      "El inspector de sanidad encontró una irregularidad tuya y pagaste la multa para no perder trabajo",
      "Derramaste el caldo base del día por correr en cocina, tuviste que poner para reponerlo",
      "Mandaste un pedido con alérgenos a un cliente, te demandaron y gastaste en abogados",
      "Rompiste tres platos de cerámica italiana, te salieron más caros que tu día de sueldo"
    ]
  },
  programador: {
    success: [
      "Arreglaste un bug en producción con una sola línea de código y cobraste bono",
      "Copiaste y pegaste código de StackOverflow, funcionó perfecto y te pagaron",
      "Terminaste el sprint 3 días antes y estuviste jugando, pero cobraste full",
      "Optimizaste la base de datos y la empresa te dio una comisión de ahorro",
      "Hiciste un script que hace tu trabajo solo y cobraste sin hacer nada",
      "Sobreviviste a un deploy en viernes sin tirar el servidor",
      "Hackeaste la red del vecino para no pagar internet y ahorraste",
      "Vendiste una app sencilla que hiciste en una tarde por buen precio",
      "El cliente aceptó el diseño a la primera sin pedir cambios absurdos",
      "Resolviste un error de CSS que llevaba meses rompiendo la web"
    ],
    fail: [
      "Subiste un query malicioso sin querer, borraste la base de datos y te cobraron la restauración",
      "Tu código sobrecargó los servidores de AWS, la factura llegó alta y la pagaste tú",
      "Derramaste todo tu termo de café sobre la MacBook Pro de la oficina, descuento masivo",
      "Instalaste un paquete npm infectado, comprometiste el proyecto y pagaste la auditoría de seguridad",
      "Incumpliste tu contrato freelance y el cliente te cobró penalización por retrasos"
    ]
  },
  repartidor: {
    success: [
      "Entregaste la pizza antes de los 30 minutos esquiando en el tráfico, propina segura",
      "Esquivaste 5 baches y 3 perros, la comida llegó intacta y te premiaron",
      "Te tocó entregar en zona de ricos y te dieron propina en dólares",
      "Agarraste tarifa dinámica por la lluvia y ganaste el triple",
      "Optimizaste tu ruta y entregaste 10 paquetes en una hora",
      "El cliente no salió a recibir y la app te regaló la comida más tu pago",
      "Manejaste con una mano mientras te cubrías del sol y llegaste a tiempo",
      "Entregaste un pedido frágil cruzando un cerro y cobraste extra",
      "Ayudaste a otro repartidor ponchado y te disparó la cena",
      "Trabajaste el turno nocturno y sacaste el bono de desvelado"
    ],
    fail: [
      "Caíste en un bache gigante, doblaste el rin de la moto y pagaste mecánico urgente",
      "El pedido de sushi caro se volteó y aplastó, el cliente lo rechazó y la app te lo descontó",
      "Te pasaste un alto por la prisa, tránsito te detuvo y la multa te dejó seco",
      "Te robaron el celular montado en el manubrio mientras buscabas la dirección",
      "Dejaste mal puesta la patita de la moto, se cayó rompiendo las direccionales, gasto seguro"
    ]
  },
  comerciante: {
    success: [
      "Le vendiste hielo a un esquimal, tu nivel de persuasión te llenó de dinero",
      "Hiciste promo de 'lleva 2, paga 3' y la gente cayó, ganancia pura",
      "Vendiste todo el lote rezagado de fundas de celular y forraste la caja",
      "Negociaste mayoreo como un tiburón y sacaste un margen enorme",
      "Abusaste de la tendencia en TikTok y vendiste cosas chinas al triple",
      "Tu local se llenó de turistas y les cobraste tarifa 'gringa'",
      "Aplicaste la de 'ya es lo menos' y no cediste en el precio",
      "Cambiaste los aparadores y las ventas subieron mágicamente",
      "Vendiste mercancía que pensabas que ya era pérdida total",
      "Un cliente mayorista te vació la tienda en una sola compra"
    ],
    fail: [
      "Te engañaron pagándote con billetes de denominación alta falsos, perdiste caja y producto",
      "Te cayó un inspector de hacienda y, como te faltaba un papel, pagaste multa fuertísima",
      "Dejaste la mercancía en el sol, se decoloró y arruinó toda, pura pérdida",
      "Invertiste todos tus ahorros en los spinners justo cuando pasaron de moda, fracaso financiero",
      "Tuviste que pagarle los daños a un cliente que resbaló en la entrada de tu local"
    ]
  }
};