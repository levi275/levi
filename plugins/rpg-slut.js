let cooldowns = {};

const handler = async (m, { conn }) => {
    const users = global.db.data.users;
    const senderId = m.sender;

    if (typeof users[senderId].coin !== "number") users[senderId].coin = 0;
    if (typeof users[senderId].bank !== "number") users[senderId].bank = 0;

    const premiumBenefit = users[senderId].premium ? 1.30 : 1.0;
    const cooldown = 5 * 60 * 1000;

    if (cooldowns[senderId] && Date.now() - cooldowns[senderId] < cooldown) {
        const remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown - Date.now()) / 1000));
        return m.reply(`🥵 Necesitas recuperar el aliento. Vuelve en *${remaining}*.`);
    }

    const winChance = 0.70;
    const didWin = Math.random() < winChance;

    let userIds = Object.keys(users).filter(u => u !== senderId && !users[u].banned);
    let targetId = userIds.length > 0 ? userIds[Math.floor(Math.random() * userIds.length)] : senderId;

    if (didWin) {
        const amount = Math.floor((Math.random() * 10000 + 4000) * premiumBenefit);
        users[senderId].coin += amount;
        await m.react('🥵');
        const phrase = pickRandom(frasesGanancia).replace('@usuario', `@${targetId.split('@')[0]}`);
        await conn.sendMessage(m.chat, {
            text: `${phrase} y ganaste *¥${amount.toLocaleString()} ${m.moneda}*.`,
            contextInfo: { mentionedJid: [targetId] }
        }, { quoted: m });

    } else {
        const amount = Math.floor(Math.random() * 18000 + 8000);
        let total = users[senderId].coin + users[senderId].bank;
        let loss = Math.min(total, amount);

        if (users[senderId].coin >= loss) {
            users[senderId].coin -= loss;
        } else {
            let resto = loss - users[senderId].coin;
            users[senderId].coin = 0;
            users[senderId].bank = Math.max(0, users[senderId].bank - resto);
        }
        await m.react('💔');
        const phrase = pickRandom(frasesPerdida);
        await conn.reply(m.chat, `${phrase} y perdiste *¥${loss.toLocaleString()} ${m.moneda}*.`, m);
    }

    cooldowns[senderId] = Date.now();
};

handler.help = ['slut'];
handler.tags = ['economy'];
handler.command = ['slut', 'prostituirse'];
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

const frasesGanancia = [
    "🤤 Le hiciste el 'gawk gawk 3000' a @usuario sin piedad",
    "🔥 Le diste una nalgada a @usuario que hasta gritó 'ay, papi'",
    "😩 Le agarraste el paquete a @usuario y lo dejaste temblando",
    "🤯 Usaste las dos manos y la boca a la vez con @usuario, quedó mudo",
    "💀 Le rebotaste encima a @usuario tan fuerte que ahora duda de su existencia",
    "🥵 Le hiciste un baile privado a @usuario en plena calle",
    "😈 Te pusiste en 4 y @usuario no dudó ni un segundo",
    "💦 Le lambiste el ombligo a @usuario sin que te lo pidiera",
    "📸 Te grabaron haciendo cositas con @usuario y ahora tienes un OnlyFans exitoso",
    "🤸‍♂️ Le hiciste el helicóptero con la cola a @usuario",
    "🍆📦 Te hiciste pasar por delivery y le entregaste el 'paquete' a @usuario",
    "🎤 Grabaste un ASMR lamiendo un micrófono para @usuario",
    "🦶 Un cliente te pagó extra solo por olerte los pies",
    "🤡 Hiciste un cosplay de Harley Quinn para @usuario y te llenó de dinero",
    "🛀 Vendiste un frasco con el agua de tu baño a un simp de @usuario"
];

const frasesPerdida = [
    "😭 Le mordiste la verga a un cliente sin querer y te demandó",
    "🏥 Te resbalaste en el lubricante, caíste encima del cliente y tuviste que pagar el hospital",
    "🤢 No te bañaste y el cliente te vomitó encima del asco",
    "💔 Le hablaste de tu ex en medio del acto y te canceló el servicio",
    "💸 El cliente se fue sin pagar y además se llevó tu celular",
    "🚔 Te arrestaron en una redada y tuviste que pagar una fianza carísima",
    "🤡 Te enamoraste del cliente y terminaste pagándole tú a él",
    "🚑 Te quedaste atorado en una pose y tuvieron que llamar a los bomberos; la multa fue enorme",
    "💥 Rompiste la cama del motel y te la cobraron al triple",
    "📉 El cliente te pagó con NFTs de monos y su valor se fue a cero al instante",
    "❤️‍🩹 Te dio una reacción alérgica al disfraz de látex",
    "👨‍ tío El cliente resultó ser tu tío y te desheredó en ese mismo momento",
    "😵 El cliente murió de un infarto en pleno acto y su familia te demandó por homicidio culposo"
];
