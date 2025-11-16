const handler = (m) => m;

handler.before = async function(m, { participants }) {
let senderJid = m.sender;
if (m.sender.endsWith('@lid') && m.isGroup && participants) {
const pInfo = participants.find(p => p.lid === m.sender);
if (pInfo && pInfo.id) senderJid = pInfo.id;
}

if (db.data.users[senderJid]) {
if (db.data.users[senderJid].suit < 0) db.data.users[senderJid].suit = 0;
}

const room = Object.values(this.suit).find((room) => room.id && room.status && [room.p, room.p2].includes(senderJid));
if (room) {
let win = '';
let tie = false;
if (senderJid == room.p2 && /^(acc(ept)?|terima|aceptar|gas|aceptare?|nao|gamau|rechazar|ga(k.)?bisa)/i.test(m.text) && m.isGroup && room.status == 'wait') {
if (/^(tolak|gamau|rechazar|ga(k.)?bisa)/i.test(m.text)) {
const textno = `${emoji2} @${room.p2.split`@`[0]} 𝐑𝐞𝐜𝐡𝐚𝐳𝐨 𝐞𝐥 𝐏𝐕𝐏, 𝐞𝐥 𝐣𝐮𝐞𝐠𝐨 𝐬𝐞 𝐜𝐚𝐧𝐜𝐞𝐥𝐚.`;
m.reply(textno, null, {mentions: this.parseMention(textno)});
delete this.suit[room.id];
return !0;
}
room.status = 'play';
room.asal = m.chat;
clearTimeout(room.waktu);
const textplay = `🎮 𝐆𝐚𝐦𝐞𝐬 - 𝐏𝐕𝐏 - 𝐆𝐚𝐦𝐞𝐬 🎮\n\n—◉ 𝐄𝐥 𝐣𝐮𝐞𝐠𝐨 𝐜𝐨𝐦𝐢𝐞𝐧𝐳𝐚, 𝐥𝐚𝐬 𝐨𝐩𝐜𝐢𝐨𝐧𝐞𝐬 𝐡𝐚𝐧 𝐬𝐢𝐝𝐨 𝐞𝐧𝐯𝐢𝐚𝐝𝐚𝐬 𝐚 𝐥𝐨𝐬 𝐜𝐡𝐚𝐭𝐬 𝐩𝐫𝐢𝐯𝐚𝐝𝐨𝐬 𝐝𝐞 @${room.p.split`@`[0]} 𝐲 @${room.p2.split`@`[0]}\n\n◉ 𝐒𝐞𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐞𝐧 𝐮𝐧𝐚 𝐨𝐩𝐜𝐢𝐨𝐧 𝐞𝐧 𝐬𝐮𝐬 𝐜𝐡𝐚𝐭𝐬 𝐩𝐫𝐢𝐯𝐚𝐝𝐨𝐬, 𝐫𝐞𝐬𝐩𝐞𝐜𝐭𝐢𝐯𝐚𝐦𝐞𝐧𝐭𝐞.\n*◉ 𝐄𝐥𝐞𝐠𝐢𝐫 𝐨𝐩𝐜𝐢𝐨́𝐧 𝐞𝐧 wa.me/${conn.user.jid.split`@`[0]}*`;
m.reply(textplay, m.chat, {mentions: this.parseMention(textplay)});
const comienzop = `${emoji} 𝐏𝐨𝐫 𝐟𝐚𝐯𝐨𝐫, 𝐬𝐞𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐞 𝐮𝐧𝐚 𝐝𝐞 𝐥𝐚𝐬 𝐬𝐢𝐠𝐮𝐢𝐞𝐧𝐭𝐞𝐬 𝐨𝐩𝐜𝐢𝐨𝐧𝐞𝐬:
piedra
papel
tijera\n𝐆𝐚𝐧𝐚𝐝𝐨𝐫 +${room.poin}𝐗𝐏\n𝐏𝐞𝐫𝐝𝐞𝐝𝐨𝐫 ${room.poin_lose}𝐗𝐏\n*responda al mensaje con la opción que desea*
*ejemplo: papel*`;
const comienzop2 = `${emoji} 𝐏𝐨𝐫 𝐟𝐚𝐯𝐨𝐫, 𝐬𝐞𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐞 𝐮𝐧𝐚 𝐝𝐞 𝐥𝐚𝐬 𝐬𝐢𝐠𝐮𝐢𝐞𝐧𝐭𝐞𝐬 𝐨𝐩𝐜𝐢𝐨𝐧𝐞𝐬:
piedra
papel
tijera\n𝐆𝐚𝐧𝐚𝐝𝐨𝐫 +${room.poin}𝐗𝐏\n𝐏𝐞𝐫𝐝𝐞𝐝𝐨𝐫 ${room.poin_lose}𝐗𝐏\n*responda al mensaje con la opción que desea*
*ejemplo: papel*`;

if (!room.pilih) this.sendMessage(room.p, {text: comienzop}, {quoted: m});
if (!room.pilih2) this.sendMessage(room.p2, {text: comienzop2}, {quoted: m});
room.waktu_milih = setTimeout(() => {
const iniciativa = `${emoji2} 𝐍𝐢𝐧𝐠𝐮́𝐧 𝐣𝐮𝐠𝐚𝐝𝐨𝐫 𝐭𝐨𝐦𝐨 𝐥𝐚 𝐢𝐧𝐢𝐜𝐢𝐚𝐭𝐢𝐯𝐚 𝐝𝐞 𝐞𝐦𝐩𝐞𝐳𝐚𝐫 𝐞𝐥 𝐣𝐮𝐞𝐠𝐨, 𝐞𝐥 𝐏𝐕𝐏 𝐬𝐞 𝐡𝐚 𝐜𝐚𝐧𝐜𝐞𝐥𝐚𝐝𝐨.`;
if (!room.pilih && !room.pilih2) this.sendMessage(m.chat, {text: iniciativa}, {quoted: m});
else if (!room.pilih || !room.pilih2) {
win = !room.pilih ? room.p2 : room.p;
const textnull = `${emoji2} @${(room.pilih ? room.p2 : room.p).split`@`[0]} 𝐍𝐨 𝐞𝐥𝐞𝐠𝐢𝐬𝐭𝐞 𝐧𝐢𝐧𝐠𝐮𝐧𝐚 𝐨𝐩𝐜𝐢𝐨́𝐧, 𝐟𝐢𝐧 𝐝𝐞𝐥 𝐏𝐕𝐏.`;
this.sendMessage(m.chat, {text: textnull}, {quoted: m}, {mentions: this.parseMention(textnull)});
db.data.users[win == room.p ? room.p : room.p2].exp += room.poin;
db.data.users[win == room.p ? room.p : room.p2].exp += room.poin_bot;
db.data.users[win == room.p ? room.p2 : room.p].exp -= room.poin_lose;
}
delete this.suit[room.id];
return !0;
}, room.timeout);
}
const jwb = senderJid == room.p;
const jwb2 = senderJid == room.p2;
const g = /tijera/i;
const b = /piedra/i;
const k = /papel/i;
const reg = /^(tijera|piedra|papel)/i;
if (jwb && reg.test(m.text) && !room.pilih && !m.isGroup) {
room.pilih = reg.exec(m.text.toLowerCase())[0];
room.text = m.text;
m.reply(`${emoji} 𝐇𝐚𝐬 𝐞𝐥𝐞𝐠𝐢𝐝𝐨 ${m.text}, 𝐫𝐞𝐠𝐫𝐞𝐬𝐚 𝐚𝐥 𝐠𝐫𝐮𝐩𝐨 𝐲 ${room.pilih2 ? `𝐑𝐞𝐯𝐢𝐬𝐚 𝐥𝐨𝐬 𝐫𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨𝐬` : '𝐄𝐬𝐩𝐞𝐫𝐚 𝐥𝐨𝐬 𝐫𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨𝐬'}`);
if (!room.pilih2) this.reply(room.p2, `${emoji2} 𝐄𝐥 𝐨𝐩𝐨𝐧𝐞𝐧𝐭𝐞 𝐚 𝐞𝐥𝐞𝐠𝐢𝐝𝐨, 𝐞𝐬 𝐭𝐮 𝐭𝐮𝐫𝐧𝐨 𝐝𝐞 𝐞𝐥𝐞𝐠𝐢𝐫!!.`, 0);
}
if (jwb2 && reg.test(m.text) && !room.pilih2 && !m.isGroup) {
room.pilih2 = reg.exec(m.text.toLowerCase())[0];
room.text2 = m.text;
m.reply(`${emoji} 𝐇𝐚𝐬 𝐞𝐥𝐞𝐠𝐢𝐝𝐨 ${m.text}, 𝐫𝐞𝐠𝐫𝐞𝐬𝐚 𝐚𝐥 𝐠𝐫𝐮𝐩𝐨 𝐲 ${room.pilih ? `𝐑𝐞𝐯𝐢𝐬𝐚 𝐥𝐨𝐬 𝐫𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨𝐬` : '𝐄𝐬𝐩𝐞𝐫𝐚 𝐥𝐨𝐬 𝐫𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨𝐬'}`);
if (!room.pilih) this.reply(room.p, `${emoji2} 𝐄𝐥 𝐨𝐩𝐨𝐧𝐞𝐧𝐭𝐞 𝐚 𝐞𝐥𝐞𝐠𝐢𝐝𝐨, 𝐞𝐬 𝐭𝐮 𝐭𝐮𝐫𝐧𝐨 𝐝𝐞 𝐞𝐥𝐞𝐠𝐢𝐫!!.`, 0);
}
const stage = room.pilih;
const stage2 = room.pilih2;
if (room.pilih && room.pilih2) {
clearTimeout(room.waktu_milih);
if (b.test(stage) && g.test(stage2)) win = room.p;
else if (b.test(stage) && k.test(stage2)) win = room.p2;
else if (g.test(stage) && k.test(stage2)) win = room.p;
else if (g.test(stage) && b.test(stage2)) win = room.p2;
else if (k.test(stage) && b.test(stage2)) win = room.p;
else if (k.test(stage) && g.test(stage2)) win = room.p2;
else if (stage == stage2) tie = true;
this.reply(room.asal, `
*👑 𝐑𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨𝐬 𝐝𝐞𝐥 𝐏𝐕𝐏 👑*${tie ? '\n*—◉ 𝐄𝐦𝐩𝐚𝐭𝐞!!*' : ''}
*@${room.p.split`@`[0]} (${room.text})* ${tie ? '' : room.p == win ? ` *𝐆𝐚𝐧𝐨 🥳 +${room.poin}𝐗𝐏*` : ` *𝐏𝐞𝐫𝐝𝐢𝐨 🤡 ${room.poin_lose}𝐗𝐏*`}
*@${room.p2.split`@`[0]} (${room.text2})* ${tie ? '' : room.p2 == win ? ` *𝐆𝐚𝐧𝐨 🥳 +${room.poin}𝐗𝐏*` : ` *𝐏𝐞𝐫𝐝𝐢𝐨 🤡 ${room.poin_lose}𝐗𝐏*`}
`.trim(), m, {mentions: [room.p, room.p2]} );
if (!tie) {
db.data.users[win == room.p ? room.p : room.p2].exp += room.poin;
db.data.users[win == room.p ? room.p : room.p2].exp += room.poin_bot;
db.data.users[win == room.p ? room.p2 : room.p].exp += room.poin_lose;
}
delete this.suit[room.id];
}
}
return !0;
};
handler.exp = 0;
export default handler;