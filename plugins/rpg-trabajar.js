let cooldowns = {};

const handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender];
    if (!user.coin) user.coin = 0;
    if (!user.bank) user.bank = 0;

    const premiumBenefit = user.premium ? 1.25 : 1.0;
    const cooldown = 3 * 60 * 1000;

    if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < cooldown) {
        const remaining = segundosAHMS(Math.ceil((cooldowns[m.sender] + cooldown - Date.now()) / 1000));
        return conn.reply(m.chat, `⏱️ Tómate un descanso, la chamba puede esperar. Vuelve en *${remaining}*.`, m);
    }

    const winChance = 0.85;
    const didWin = Math.random() < winChance;

    if (didWin) {
        const amount = Math.floor((Math.random() * 4000 + 1000) * premiumBenefit);
        user.coin += amount;
        const work = pickRandom(trabajosBuenos);
        await m.react('✅');
        await conn.reply(m.chat, `${work} y te llevaste *¥${amount.toLocaleString()} ${m.moneda}*.\n\n*💰 Cartera:* ¥${user.coin.toLocaleString()} | *🏦 Banco:* ¥${user.bank.toLocaleString()}`, m);
    } else {
        const amount = Math.floor(Math.random() * 3000 + 500);
        let total = user.coin + user.bank;
        let loss = Math.min(total, amount);

        if (user.coin >= loss) {
            user.coin -= loss;
        } else {
            let resto = loss - user.coin;
            user.coin = 0;
            user.bank = Math.max(0, user.bank - resto);
        }

        const work = pickRandom(trabajosMalos);
        await m.react('❌');
        await conn.reply(m.chat, `${work} y en el proceso perdiste *¥${loss.toLocaleString()} ${m.moneda}*.\n\n*💰 Cartera:* *¥${user.coin.toLocaleString()}* | *🏦 Banco:* *¥${user.bank.toLocaleString()}*`, m);
    }

    cooldowns[m.sender] = Date.now();
};

handler.help = ['chamba', 'trabajar', 'work'];
handler.tags = ['economy'];
handler.command = ['chamba', 'trabajar', 'w', 'work', 'chambear'];
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

const trabajosBuenos = [
    "💻 Programaste un bot para Discord",
    "🎨 Vendiste un diseño de logo en Fiverr",
    "🐕 Paseaste al perro de tu vecino",
    "🎵 Fuiste DJ en una fiesta de cumpleaños",
    "📝 Tradujiste un documento importante",
    "🍔 Trabajaste de repartidor de comida por una noche",
    "🎮 Ganaste un pequeño torneo de videojuegos online",
    "🔧 Reparaste la computadora de un amigo",
    "✍️ Escribiste artículos para un blog",
    "🎬 Editaste un video para un Youtuber",
    "🖼️ Creaste y vendiste stickers personalizados",
    "🛒 Hiciste las compras para una persona mayor",
    "🎨 Pintaste una miniatura para un juego de mesa",
    "🤳 Creaste un filtro de Instagram que se hizo popular",
    "🤔 Llenaste encuestas en línea",
    "📦 Ayudaste en una mudanza",
    "💡 Le enseñaste a alguien a usar un nuevo software",
    "🚗 Lavaste el coche de tus padres",
    "🌿 Cuidaste las plantas de un amigo que se fue de viaje",
    "🎂 Horneaste un pastel para una venta de garaje"
];

const trabajosMalos = [
    "💥 Intentaste arreglar una tubería y causaste una inundación, tuviste que pagar los daños",
    "💸 Invertiste en una criptomoneda que resultó ser una estafa",
    "💔 Un cliente no te pagó por el trabajo de diseño que realizaste",
    "☕ Derramaste café en la laptop de un cliente y tuviste que cubrir la reparación",
    "🤡 Compraste productos para revender, pero nadie los quiso y perdiste la inversión",
    " штраф Te multaron por estacionarte mal durante una entrega",
    "📵 Se te cayó el celular trabajando y tuviste que comprar uno nuevo",
    "📉 Apostaste en una carrera de caballos y perdiste",
    "🍽️ Rompiste varios platos trabajando de mesero y te los descontaron de tu sueldo",
    "🤦‍♂️ Caíste en una estafa de phishing y perdiste dinero de tu cuenta",
    "🔥 Quemaste la comida que estabas preparando para un evento y tuviste que reponer los ingredientes",
    "🚕 El taxi al trabajo te costó más de lo que ganaste ese día",
    "🌧️ Se arruinó el material con el que trabajabas por culpa de la lluvia",
    "Fake Compraste una herramienta por internet que resultó ser de mala calidad y se rompió",
    "🤧 Te enfermaste y tuviste que gastar en medicinas más de lo que ganaste"
];
