import { promises } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import { xpRange } from '../lib/levelling.js';
import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys';
import moment from 'moment-timezone';

// ... (Tu objeto 'defaultMenu' sigue igual) ...
const defaultMenu = {
  before: `𝙃𝙤𝙡𝙖 *%name* ${ucapan()}
𝙢𝙞 𝙣𝙤𝙢𝙗𝙧𝙚 𝙚𝙨 𝙍𝙪𝙗𝙮, 𝙮 𝙩𝙚 𝙙𝙚𝙨𝙚𝙤 𝙪𝙣𝙖𝙨 𝙛𝙚𝙡𝙞𝙘𝙚𝙨 𝙛𝙞𝙚𝙨𝙩𝙖𝙨! 🧴  𖹥

♡  ∩_∩
  （„• ֊ •„)♡
┏━━∪∪━⏤͟͟͞͞★꙲⃝͟🌷❈┉━━━┓
┃  *𝖨𝖭𝖥𝖮 𝖣𖤀 𝖫𝖠 𝖡𝖮𝖳* ┃┈──❊:::::::¨¨*:::::::❊──┈
┃ ◦ 👑 *Creador:* Dioneibi
┃ ◦ 🌎 *Modo:* Pública
┃ ◦ 💻 *Baileys:* Multi Device
┃ ◦ ⏰ *Tiempo Activa:* %uptime
┃ ◦ 👥 *Usuarios:* %totalreg
┗━━━━⏤͟͟͞͞★꙲⃝͟🌷❈┉━━━━━━┛`.trim(),
};


let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
  try {
    // ... (Todo tu setup de variables, uptime, fkontak, media, etc. sigue igual) ...
    let _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json')).catch(_ => ({}))) || {};
    let { exp, level, role } = global.db.data.users[m.sender];
    let { min, xp, max } = xpRange(level, global.multiplier);
    let name = await conn.getName(m.sender);

    let _uptime = process.uptime() * 1000;
    let _muptime;
    if (process.send) {
      process.send('uptime');
      _muptime = await new Promise(resolve => {
        process.once('message', resolve);
        setTimeout(resolve, 1000);
      }) * 1000;
    }

    let muptime = clockString(_muptime);
    let uptime = clockString(_uptime);
    let totalreg = Object.keys(global.db.data.users).length;

    let fkontak = null;
    try {
      const res = await fetch('https://i.postimg.cc/XqsLDBQ4/Ruby-Hoshino-Trailer-season-3.jpg');
      const thumb2 = Buffer.from(await res.arrayBuffer());
      fkontak = {
        key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
        message: {
          productMessage: {
            product: {
              productImage: { jpegThumbnail: thumb2 },
              title: '𝖬𝖤𝖭𝖴 𝖫𝖨𝖲𝖳 • 𝖱𝖴𝖡𝖸',
              description: '╰┈➤ 𝖨𝖭𝖳𝖤𝖱𝖠𝖢𝖳𝖨𝖵𝖤 𝖬𝖤𝖭𝖴',
              retailerId: 'AI • ESTADO',
              productImageCount: 1
            },
            businessOwnerJid: '0@s.whatsapp.net'
          }
        },
        participant: '0@s.whatsapp.net'
      };
    } catch {}

    const imageUrl = 'https://files.catbox.moe/yenx0h.png';
    let media = await prepareWAMessageMedia(
      { image: { url: imageUrl } },
      { upload: conn.waUploadToServer }
    );

    // ... (Tu array 'sections' con los 12 menús sigue igual) ...
    let sections = [{
      title: "𝐒𝐄𝐋𝐄𝐂𝐂𝐈𝐎𝐍𝐄 𝐀𝐐𝐔𝐈",
      rows: [
        { title: "🌟 𝗠𝗘𝗡𝗨́ 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗢 🌟", description: "🍧 ꒰ 𝗺𝘂𝗲𝘀𝘁𝗿𝗮 𝘁𝗼𝗱𝗼𝘀 𝗹𝗼𝘀 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀 𝗲𝗻 𝗥𝘂𝗯𝘆 ꒱", id: `${_p}menuall` },
        { title: "📥 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦 📥", description: "🎧 ꒰ 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮 𝗮𝘂𝗱𝗶𝗼𝘀, 𝘃𝗶𝗱𝗲𝗼𝘀, 𝗜𝗴, 𝗙𝗕, 𝗧𝗶𝗸𝗧𝗼𝗸 𝘆 𝗺𝗮́𝘀 ꒱", id: `${_p}menudescargas` },
        // ... (etc. todas tus filas) ...
        { title: "🔍 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗕𝗨́𝗦𝗤𝗨𝗘𝗗𝗔𝗦 🔍", description: "🌍 ꒰ 𝗕𝘂𝘀𝗰𝗮 𝗶𝗻𝗳𝗼, 𝗹𝗲𝘁𝗿𝗮𝘀, 𝘃𝗶𝗱𝗲𝗼𝘀 𝘆 𝗺𝘂𝗰𝗵𝗼 𝗺𝗮́𝘀 𝗲𝗻 𝗹𝗶́𝗻𝗲𝗮 ꒱", id: `${_p}menubusquedas` }
      ]
    }];

    // ... (Tu 'bodyText' y 'beforeText' siguen igual) ...
     let bodyText = `
  🪷ᩚ⃟꙰⟡˖ ࣪𝗜𝖭𝖥𝖮 𝖣𝖤𝖫 𝖴𝖲𝖴𝖠𝖱𝖨𝖮 🪷⃟✿˚
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
 ი ̯ 🎋̸̶ *𝖭𝖮𝖬𝖡𝖱𝖤*: %name
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
 ი ̯ 🎋̸̶ *𝖤𝖷𝖯𝖤𝖱𝖨𝖤𝖭𝖢𝖨𝖠:* %exp
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
 ი ̯ 🎋̸̶ *𝖭𝖨𝖵𝖤𝖫:* %level
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
 ი ̯ 🎋̸̶ *𝖱𝖠𝖭𝖦𝖮:* %role
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─`;

    bodyText = bodyText.replace(/%name/g, name)
                       .replace(/%exp/g, exp)
                       .replace(/%level/g, level)
                       .replace(/%role/g, role);

    let beforeText = defaultMenu.before.replace(/%name/g, name)
                                       .replace(/%muptime/g, muptime)
                                       .replace(/%uptime/g, uptime)
                                       .replace(/%totalreg/g, totalreg)
                                       .replace(/%exp/g, exp)
                                       .replace(/%level/g, level)
                                       .replace(/%role/g, role);

    // ################
    // ## EL INTENTO ESTÁ AQUÍ ##
    // ################
    // Esta es tu estructura original.
    // Voy a poner el "quick_reply" (Menu Manual) PRIMERO
    // y el "single_select" (La Lista) SEGUNDO.
    
    const interactiveMessage = {
      header: {
        title: "",
        hasMediaAttachment: true,
        imageMessage: media.imageMessage
      },
      body: { 
        text: `${beforeText}\n\n${bodyText}`
      },
      footer: { text: "⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟𖹭 𝐁𖹭t͟𑁯ᰍ" },
      
      // Estamos usando tu estructura deseada: nativeFlowMessage
      nativeFlowMessage: {
        buttons: [
          // INTENTO: Poner el botón que falla (quick_reply) primero.
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "꒰꒰ 🍒 𝐌𝖾𝗇𝗎 𝐌𝖺𝗇𝗎𝖺𝗅 Ი꯭ᰍ",
              id: `${_p}menumanual` // Esto debería enviar ".menumanual"
            })
          },
          // Y el botón que sí funciona (single_select) segundo.
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: " ❀⃘⃛͜ ۪۪۪݃𓉘᳟ี ⃞̸͢𑁃 ̚𓉝᳟ี𝐌𝐄𝐍𝐔 𝐁𝐎𝐓❀⃘⃛͜",
              sections: sections
            })
          }
        ],
        messageParamsJson: ""
      }
    };
    // ################
    // ## FIN DEL INTENTO ##
    // ################

    let msgi = generateWAMessageFromContent(
      m.chat, 
      { viewOnceMessage: { message: { interactiveMessage } } }, 
      { userJid: conn.user.jid, quoted: fkontak || m }
    );

    await conn.relayMessage(m.chat, msgi.message, { messageId: msgi.key.id });
    m.react('💞');

  } catch (e) {
    conn.reply(m.chat, `꒰ 💔 Oops... ꒱ 𝗻𝗼 𝘀𝗲 𝗽𝘂𝗱𝗼 𝗰𝗮𝗿𝗴𝗮𝗿 𝗲𝗹 𝗺𝗲𝗻𝘂́.\n\n*Razón:* ${e}`, m);
    throw e;
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.register = true;
handler.command = ['menu', 'menú', 'listmenu'];

export default handler;

// --- Funciones auxiliares (sin cambios) ---
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  return [d, 'D', h, 'H', m, 'M'].map(v => v.toString().padStart(2, '0')).join(' ');
}

function ucapan() {
  const time = moment.tz('America/Lima').format('HH');
  let res = "Buenas Noches 🌙";
  if (time >= 5 && time < 12) res = "𝘽𝙪𝙚𝙣𝙤𝙨 𝘿𝙞́𝙖𝙨 ☀️";
  else if (time >= 12 && time < 18) res = "𝘽𝙪𝙚𝙣𝙖𝙨 𝙏𝙖𝙧𝙙𝙚𝙨 🌤️";
  else if (time >= 18) res = "𝘽𝙪𝙚𝙣𝙖𝙨 𝙉𝙤𝙘𝙝𝙚𝙨 🌙";
  return res;
}