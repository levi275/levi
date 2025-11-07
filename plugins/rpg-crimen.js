let cooldowns = {};
let jail = {};

const handler = async (m, { conn }) => {
    let users = global.db.data.users;
    let senderId = m.sender;
    const user = users[senderId];

    const premiumBenefit = user.premium ? 0.8 : 1.0;
    const cooldown = 5 * 60 * 1000;
    const jailCooldown = 30 * 60 * 1000;

    if (jail[senderId] && Date.now() < jail[senderId]) {
        const remaining = segundosAHMS(Math.ceil((jail[senderId] - Date.now()) / 1000));
        return m.reply(`🚔 Estás en la cárcel. No puedes cometer crímenes por ahora. Te quedan *${remaining}*.`);
    }

    if (cooldowns[senderId] && Date.now() - cooldowns[senderId] < cooldown) {
        const remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown - Date.now()) / 1000));
        return m.reply(`⏱️ Necesitas mantener un perfil bajo. Espera *${remaining}* para tu próximo golpe.`);
    }

    const outcome = Math.random();
    const jailChance = 0.15 * premiumBenefit;
    const successChance = 0.70;

    if (outcome < jailChance) {
        jail[senderId] = Date.now() + jailCooldown;
        const reason = pickRandom(frasesPolicia);
        await m.react('🚔');
        return m.reply(`${reason}. Te atraparon y ahora estás en la cárcel por 30 minutos.`);

    } else if (outcome < jailChance + successChance) {
        const amount = Math.floor(Math.random() * 25000 + 10000);
        user.coin += amount;
        const reason = pickRandom(frasesExito);
        await m.react('💰');
        await m.reply(`${reason}. ¡Te embolsaste *¥${amount.toLocaleString()} ${m.moneda}*!\n> Saldo actual: *¥${user.coin.toLocaleString()}*`);

    } else {
        const amount = Math.floor(Math.random() * 18000 + 7000);
        let restante = amount;

        if (user.coin >= restante) {
            user.coin -= restante;
        } else {
            restante -= user.coin;
            user.coin = 0;
            if (user.bank >= restante) {
                user.bank -= restante;
            } else {
                user.bank = 0;
            }
        }
        const reason = pickRandom(frasesFracaso);
        await m.react('💀');
        await m.reply(`${reason}. En el proceso, perdiste *¥${amount.toLocaleString()} ${m.moneda}*.\n> Te queda: *¥${user.coin.toLocaleString()}* en cartera y *¥${user.bank.toLocaleString()}* en el banco.`);
    }

    cooldowns[senderId] = Date.now();
};

handler.help = ['crimen'];
handler.tags = ['economy'];
handler.command = ['crimen', 'crime'];
handler.group = true;
handler.register = true;

export default handler;

function segundosAHMS(segundos) {
    let minutos = Math.floor(segundos / 60);
    let segundosRestantes = segundos % 60;
    return `${minutos}m ${segundosRestantes}s`;
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

const frasesExito = [
    "🔫 Asaltaste un camión blindado con una pistola de agua; la confusión te dio tiempo para escapar",
    "💻 Hackeaste un cajero automático usando un tutorial de TikTok y funcionó",
    "🚁 Interceptaste un dron de reparto y te quedaste con un paquete de lujo",
    "🦶 Vendiste fotos de tus pies a un coleccionista anónimo por una suma increíble",
    "🧪 Creaste un 'remedio milagroso' con agua y azúcar y lo vendiste a un grupo de turistas",
    "🔧 Robaste el catalizador del auto de un político corrupto y lo vendiste por piezas",
    "🕴️ Te hiciste pasar por inspector de sanidad y extorsionaste a varios puestos de comida callejera",
    "🎰 Descubriste una falla en una máquina tragamonedas y la vaciaste antes de que se dieran cuenta",
    "🐓 Organizaste una pelea de gallos falsa y te fugaste con todo el dinero de las apuestas",
    "🌕 Le vendiste un terreno en la luna a un millonario excéntrico",
    "🐝 Robaste una colmena de abejas y vendiste la miel como 'elixir de la eterna juventud'",
    "💳 Clonaste la tarjeta de crédito de un influencer y la usaste para comprar criptomonedas",
    "🐶 Secuestraste la mascota de un famoso y pediste un rescate en zapatillas de edición limitada, que luego revendiste",
    "🎨 Te colaste en una subasta de arte y cambiaste un cuadro famoso por una copia. Nadie lo notó",
    "🕊️ Vendiste seguros de 'ataques de palomas' en la plaza principal. Sorprendentemente, muchos compraron",
    "🖼️ Creaste un NFT de un meme viejo y alguien lo compró por nostalgia",
    "🥑 Robaste un cargamento de aguacates y lo exportaste a un país donde son un bien de lujo",
    "🔮 Leíste el futuro a un grupo de personas y les 'aconsejaste' invertir en tu negocio fantasma"
];

const frasesFracaso = [
    "💀 Intentaste robarle la cartera a una anciana, pero era una ex-campeona de judo. Tuviste que pagarle para que no presentara cargos",
    "🤡 Tu cómplice te traicionó y se escapó con el botín, no sin antes robarte tu propia cartera",
    "💸 Huiste tan rápido que se te cayó todo el dinero en una alcantarilla. Solo pudiste ver cómo se lo llevaba la corriente",
    "👮 Intentaste sobornar a un oficial, pero te pidió una 'mordida' tan alta que te dejó sin ganancias",
    "🦴 El botín eran solo cupones de descuento para una tienda de mascotas. Tuviste que pagar el taxi de la huida de tu bolsillo",
    "💥 Rompiste una ventana para entrar a robar, lo que activó una alarma. Tuviste que pagar los daños para evitar la cárcel",
    "💨 Te gastaste todo el dinero en un amuleto de 'invisibilidad' que claramente no funcionó",
    "🎭 La víctima del robo te reconoció y te extorsionó para no ir a la policía. Te costó el doble de lo que robaste",
    "🍿 Te escondiste en un cine para escapar, pero te quedaste viendo la película y compraste palomitas y refresco grande",
    "🔥 El dinero robado estaba marcado con tinta invisible. Tuviste que quemarlo todo para no dejar evidencia",
    "⌚ Intentaste vender un reloj robado, pero el comprador era un policía encubierto. Tuviste que pagar una fianza",
    "🦷 Te caíste durante la huida y te rompiste un diente. La visita al dentista fue más cara que el botín",
    "🗣️ Tu plan era brillante, pero se lo contaste a tu amigo y él lo hizo primero. Luego te pidió dinero prestado",
    "🐕 El perro guardián se comió parte del dinero. Lo que recuperaste no alcanzó ni para las gasas",
    "🚌 Te diste a la fuga en un autobús, pero no tenías cambio y tuviste que pagar el pasaje con un billete grande del botín",
    "🩸 Te confundiste y en lugar de robar un banco, entraste a un banco de sangre. Saliste pálido y con menos dinero"
];

const frasesPolicia = [
    "🤳 Te atraparon porque publicaste un selfie con el botín en tus estados de WhatsApp",
    "😴 Te quedaste dormido en la escena del crimen y la policía te encontró roncando sobre el dinero",
    "📝 Dejaste tu currículum en el mostrador de la tienda que robaste. Te llamaron para una 'entrevista'",
    "🛴 Intentaste huir en un patinete eléctrico, pero te quedaste sin batería a media cuadra de la estación de policía",
    "🦜 El loro de la víctima no paraba de repetir tu nombre y tu dirección. Fue un testimonio clave",
    "🗿 Te escondiste de la policía en un concurso de estatuas humanas. Perdiste cuando te dio un calambre",
    "🗺️ Usaste Google Maps para tu ruta de escape, pero accidentalmente la compartiste en vivo con todos tus contactos",
    "🍩 Te identificaron gracias al ADN que dejaste en una dona a medio comer en la escena",
    "🍕 Intentaste escapar disfrazado de repartidor de pizza, pero te detuviste a entregar un pedido real",
    "🐾 Tu perro, emocionado por verte, guio a la policía directamente a tu escondite",
    "❤️ Te atraparon porque el tatuaje de 'Madre solo hay una' coincidía con la descripción del sospechoso",
    "😭 Te tropezaste y activaste accidentalmente el filtro de llanto de un bebé en tu celular, alertando a la policía",
    "👮‍♂️ Le preguntaste a un policía por la dirección de tu escondite sin darte cuenta de que era un oficial",
    "🎨 La víctima te dibujó tan bien en el retrato hablado que hasta tu mamá te reconoció y te entregó",
    "🚲 Te delató el GPS de la bicicleta que robaste para escapar"
];

