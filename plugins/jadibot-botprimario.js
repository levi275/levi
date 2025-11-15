import ws from 'ws'

let handler = async (m, { conn, text, usedPrefix, command, participants }) => {
let chat = global.db.data.chats[m.chat];

if (m.mentionedJid.length === 0) {
return m.reply(`❗ ⓘ 𝙋𝙤𝙧 𝙛𝙖𝙫𝙤𝙧, 𝙢𝙚𝙣𝙘𝙞𝙤𝙣𝙖 𝙖 𝙪𝙣 𝙗𝙤𝙩 𝙙𝙚𝙡 𝙜𝙧𝙪𝙥𝙤 𝙥𝙖𝙧𝙖 𝙚𝙨𝙩𝙖𝙗𝙡𝙚𝙘𝙚𝙧𝙡𝙤 𝙘𝙤𝙢𝙤 𝙥𝙧𝙞𝙢𝙖𝙧𝙞𝙤.\n\n> *Ejemplo:* ${usedPrefix + command} @tagdelbot`);
}

let rawBotId = m.mentionedJid[0]; 
let botJid = rawBotId;

if (rawBotId.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === rawBotId);
if (pInfo && pInfo.id) {
botJid = pInfo.id; 
}
}

const users = [
...new Set(
[...global.conns.filter(
(conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED
).map((conn) => conn)]
)
];

let selectedBot;

if (botJid === conn.user.jid || botJid === global.conn.user.jid) {
selectedBot = conn;
} else {
selectedBot = users.find(sub => sub.user.jid === botJid);
}

if (!selectedBot) {
return conn.reply(m.chat, `❌ ⓘ 𝙀𝙡 𝙪𝙨𝙪𝙖𝙧𝙞𝙤 𝙢𝙚𝙣𝙘𝙞𝙤𝙣𝙖𝙙𝙤 𝙣𝙤 𝙚𝙨 𝙪𝙣 𝙗𝙤𝙩 𝙙𝙚 𝙡𝙖 𝙧𝙚𝙙 ${global.botname || 'Ruby-Hoshino'}.`, m);
}

if (chat.botPrimario === botJid) {
return conn.reply(m.chat, `✨ ⓘ @${botJid.split`@`[0]} 𝙮𝙖 𝙚𝙨 𝙚𝙡 𝙗𝙤𝙩 𝙥𝙧𝙞𝙢𝙖𝙧𝙞𝙤. 𝙉𝙤 𝙚𝙨 𝙣𝙚𝙘𝙚𝙨𝙖𝙧𝙞𝙤 𝙘𝙖𝙢𝙗𝙞𝙖𝙧𝙡𝙤.`, m, { mentions: [botJid] });
}

chat.botPrimario = botJid;
console.log(`[Bot Primario SET] Chat: ${m.chat} | JID Guardado: ${botJid}`);

let response = `
   *੭୧.*   ᰍ 𑂳 ׁ ᥱᥣ ᑲ᥆𝗍 @${botJid.split('@')[0]} 𝖿ᥙᥱ ᥒ᥆mᑲrᥲძ᥆ ᥴ᥆m᥆ ⍴rіmᥲrі᥆ ⍴ᥲrᥲ ᥱs𝗍ᥱ grᥙ⍴᥆, ᥲ ⍴ᥲr𝗍іr ძᥱ ᥲһ᥆rᥲ 𝗍᥆ძ᥆s ᥣ᥆s ᥴ᥆mᥲᥒძ᥆s sᥱrᥲ́ᥒ ᥱȷᥱᥴᥙ𝗍ᥲძ᥆s s᥆ᥣ᥆ ⍴᥆r ᥱᥣ. ׄ   ̣̤͟✨
`.trim()

await conn.sendMessage(m.chat, { 
text: response, 
mentions: [botJid] 
}, { quoted: m });
}

handler.help = ['setbotprimario @bot', 'setbot @bot'];
handler.tags = ['grupo'];
handler.command = ['setprimary', 'botprimario', 'setprimarybot', 'setbot'];
handler.group = true;
handler.admin = true;

export default handler;