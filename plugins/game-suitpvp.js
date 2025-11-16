const timeout = 60000;
const poin = 500;
const poin_lose = -100;
const poin_bot = 200;

const handler = async (m, {conn, usedPrefix, text, participants}) => {
conn.suit = conn.suit ? conn.suit : {};

let challengerJid = m.sender;
if (m.sender.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === m.sender);
if (pInfo && pInfo.id) challengerJid = pInfo.id;
}

const rawUserToChallenge = m.mentionedJid[0] || (m.replyMessage && m.replyMessage.sender);

if (Object.values(conn.suit).find((room) => room.id.startsWith('suit') && [room.p, room.p2].includes(challengerJid))) throw `${emoji2} 𝐓𝐞𝐫𝐦𝐢𝐧𝐚 𝐭𝐮 𝐩𝐚𝐫𝐭𝐢𝐝𝐚 𝐚𝐧𝐭𝐞𝐬 𝐝𝐞 𝐢𝐧𝐢𝐜𝐢𝐚𝐫 𝐨𝐭𝐫𝐚.`;

const textquien = `${emoji} ¿𝐀 𝐪𝐮𝐢𝐞́𝐧 𝐪𝐮𝐢𝐞𝐫𝐞𝐬 𝐝𝐞𝐬𝐚𝐟𝐢𝐚𝐫? 𝐄𝐭𝐢𝐪𝐮𝐞𝐭𝐚 𝐚 𝐮𝐧 𝐮𝐬𝐮𝐚𝐫𝐢𝐨.\n\n*—◉ 𝐄𝐣𝐞𝐦𝐩𝐥𝐨:*\n${usedPrefix}suit @tag`;

if (!rawUserToChallenge) return m.reply(textquien, m.chat, {mentions: conn.parseMention(textquien)});

let challengedJid = rawUserToChallenge;
if (rawUserToChallenge.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === rawUserToChallenge);
if (pInfo && pInfo.id) challengedJid = pInfo.id;
}

if (Object.values(conn.suit).find((room) => room.id.startsWith('suit') && [room.p, room.p2].includes(challengedJid))) throw `${emoji2} 𝐄𝐥 𝐮𝐬𝐮𝐚𝐫𝐢𝐨 𝐚𝐮𝐧 𝐞𝐬𝐭𝐚 𝐞𝐧 𝐮𝐧𝐚 𝐩𝐚𝐫𝐭𝐢𝐝𝐚, 𝐞𝐬𝐩𝐞𝐫𝐚 𝐚 𝐪𝐮𝐞 𝐭𝐞𝐫𝐦𝐢𝐧𝐞 𝐩𝐚𝐫𝐚 𝐣𝐮𝐠𝐚𝐫.`;

const id = 'suit_' + new Date() * 1;
const caption = `🎮 𝐆𝐚𝐦𝐞𝐬 - 𝐏𝐕𝐏 - 𝐆𝐚𝐦𝐞𝐬 🎮\n\n—◉ @${m.sender.split`@`[0]} 𝐃𝐞𝐬𝐚𝐟𝐢𝐨 𝐚 @${rawUserToChallenge.split`@`[0]} 𝐚 𝐮𝐧 𝐏𝐕𝐏 𝐝𝐞 𝐩𝐢𝐞𝐝𝐫𝐚, 𝐩𝐚𝐩𝐞𝐥 𝐨 𝐭𝐢𝐣𝐞𝐫𝐚\n◉ 𝐄𝐬𝐜𝐫𝐢𝐛𝐞 "𝐚𝐜𝐞𝐩𝐭𝐚𝐫" 𝐩𝐚𝐫𝐚 𝐚𝐜𝐞𝐩𝐭𝐚𝐫\n◉ 𝐄𝐬𝐜𝐫𝐢𝐛𝐞 "𝐫𝐞𝐜𝐡𝐚𝐳𝐚𝐫" 𝐩𝐚𝐫𝐚 𝐫𝐞𝐜𝐡𝐚𝐳𝐚𝐫\n𝐫𝐞𝐬𝐩𝐨𝐧𝐝𝐢𝐞𝐧𝐝𝐨 𝐚𝐥 𝐦𝐞𝐧𝐬𝐚𝐣𝐞`;
const imgplaygame = `https://www.merca2.es/wp-content/uploads/2020/05/Piedra-papel-o-tijera-0003318_1584-825x259.jpeg`;

conn.suit[id] = {
chat: await conn.sendMessage(m.chat, {text: caption, mentions: [m.sender, rawUserToChallenge]}, {caption}),
id: id,
p: challengerJid,
p2: challengedJid,
status: 'wait',
waktu: setTimeout(() => {
if (conn.suit[id]) conn.reply(m.chat, `${emoji2} 𝐓𝐢𝐞𝐦𝐩𝐨 𝐝𝐞 𝐞𝐬𝐩𝐞𝐫𝐚 𝐟𝐢𝐧𝐚𝐥𝐢𝐳𝐚𝐝𝐨, 𝐞𝐥 𝐏𝐕𝐏 𝐬𝐞 𝐜𝐚𝐧𝐜𝐞𝐥𝐚 𝐩𝐨𝐫 𝐟𝐚𝐥𝐭𝐚 𝐝𝐞 𝐫𝐞𝐬𝐩𝐮𝐞𝐬𝐭𝐚.`, m);
delete conn.suit[id];
}, timeout),
poin, poin_lose, poin_bot, timeout,
};
};

handler.command = ['suitpvp', 'pvp', 'suit'];
handler.group = true;
handler.register = true;
handler.game = true;

export default handler;