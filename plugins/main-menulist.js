import { promises } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import { xpRange } from '../lib/levelling.js';
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import moment from 'moment-timezone';

const defaultMenu = {
    before: `𝙃𝙤𝙡𝙖 *%name* ${ucapan()}

𝙢𝙞 𝙣𝙤𝙢𝙗𝙧𝙚 𝙚𝙨 𝙍𝙪𝙗𝙮, 𝙮 𝙩𝙚 𝙙𝙚𝙨𝙚𝙤 𝙪𝙣𝙖𝙨 𝙛𝙚𝙡𝙞𝙘𝙚𝙨 𝙛𝙞𝙚𝙨𝙩𝙖𝙨! 🧴  𖹥

♡  ∩_∩
（„• ֊ •„)♡
┏━━∪∪━⏤͟͟͞͞★꙲⃝͟🌷❈┉━━━┓
┃  *𝖨𝖭𝖥𝖮 𝖣𝖤 𝖫𝖠 𝖡𝖮𝖳* ┃┈──❊:::::::¨¨*:::::::❊──┈
┃ ◦ 👑 *Creador:* Dioneibi
┃ ◦ 🌎 *Modo:* Pública
┃ ◦ 💻 *Baileys:* Multi Device
┃ ◦ ⏰ *Tiempo Activa:* %uptime
┃ ◦ 👥 *Usuarios:* %totalreg
┗━━━━⏤͟͟͞͞★꙲⃝͟🌷❈┉━━━━━━┛`.trim(),
};

let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
    try {
        // --- CARGA DE DATOS ---
        let { exp, level, role } = global.db.data.users[m.sender];
        let { min, xp, max } = xpRange(level, global.multiplier);
        let name = await conn.getName(m.sender);
        let totalreg = Object.keys(global.db.data.users).length;

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

        // --- TEXTOS DEL MENU ---
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

        // --- MEDIOS Y IMÁGENES ---
        const imageUrl = 'https://files.catbox.moe/yenx0h.png';
        let media;
        try {
            media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: conn.waUploadToServer });
        } catch {
            // Backup imagen por si falla
            media = await prepareWAMessageMedia({ image: { url: 'https://i.imgur.com/H08z8hP.jpg' } }, { upload: conn.waUploadToServer });
        }

        // --- SECCIONES (BOTONES) ---
        let sections = [{
            title: "𝐒𝐄𝐋𝐄𝐂𝐂𝐈𝐎𝐍𝐄 𝐀𝐐𝐔𝐈",
            rows: [
                { title: "🌟 𝗠𝗘𝗡𝗨́ 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗢 🌟", description: "🍧 ꒰ 𝗺𝘂𝗲𝘀𝘁𝗿𝗮 𝘁𝗼𝗱𝗼𝘀 𝗹𝗼𝘀 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀 ꒱", id: `${_p}menuall` },
                { title: "📥 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦 📥", description: "🎧 ꒰ 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮 𝗮𝘂𝗱𝗶𝗼𝘀, 𝘃𝗶𝗱𝗲𝗼𝘀 ꒱", id: `${_p}menudescargas` },
                { title: "⚔️ 𝗠𝗘𝗡𝗨́ 𝗘𝗖𝗢𝗡𝗢𝗠𝗜́𝗔 & 𝗥𝗣𝗚 ⚔️", description: "🎮 ꒰ 𝗠𝗶𝗻𝗮, 𝗰𝗮𝘇𝗮, 𝗴𝗮𝗻𝗮 𝗼𝗿𝗼 ꒱", id: `${_p}menueconomia` },
                { title: "🎲 𝗠𝗘𝗡𝗨́ 𝗚𝗔𝗖𝗛𝗔 🎲", description: "🎭 ꒰ 𝗖𝗼𝗹𝗲𝗰𝗰𝗶𝗼𝗻𝗮 𝗵𝗲́𝗿𝗼𝗲𝘀 ꒱", id: `${_p}menugacha` },
                { title: "🎨 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗦𝗧𝗜𝗖𝗞𝗘𝗥𝗦 🎨", description: "✨ ꒰ 𝗖𝗿𝗲𝗮 𝘀𝘁𝗶𝗰𝗸𝗲𝗿𝘀 ꒱", id: `${_p}menusticker` },
                { title: "🛠️ 𝗠𝗘𝗡𝗨́ 𝗛𝗘𝗥𝗥𝗔𝗠𝗜𝗘𝗡𝗧𝗔𝗦 🛠️", description: "⚙️ ꒰ 𝗖𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝘂́𝘁𝗶𝗹𝗲𝘀 ꒱", id: `${_p}menuherramientas` },
                { title: "👤 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗣𝗘𝗥𝗙𝗜𝗟 👤", description: "🧩 ꒰ 𝗥𝗲𝘃𝗶𝘀𝗮 𝘁𝘂 𝗲𝘀𝘁𝗮𝗱𝗼 ꒱", id: `${_p}menuperfil` },
                { title: "📢 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗚𝗥𝗨𝗣𝗢𝗦 📢", description: "🌐 ꒰ 𝗔𝗱𝗺𝗶𝗻𝗶𝘀𝘁𝗿𝗮𝗰𝗶𝗼́𝗻 ꒱", id: `${_p}menugrupo` },
                { title: "🎌 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗔𝗡𝗜𝗠𝗘 🎌", description: "💢 ꒰ 𝗥𝗲𝗮𝗰𝗰𝗶𝗼𝗻𝗲𝘀 ꒱", id: `${_p}menuanime` },
                { title: "🎮 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗝𝗨𝗘𝗚𝗢𝗦 🎮", description: "🎲 ꒰ 𝗠𝗶𝗻𝗶-𝗷𝘂𝗲𝗴𝗼𝘀 ꒱", id: `${_p}menujuegos` },
                { title: "🔥 𝗠𝗘𝗡𝗨́ 𝗣𝗜𝗖𝗔𝗡𝗧𝗘 (NSFW) 🔥", description: "🔞 ꒰ 𝗦𝗼𝗹𝗼 𝗽𝗮𝗿𝗮 𝗮𝗱𝘂𝗹𝘁𝗼𝘀 ꒱", id: `${_p}menunsfw` },
                { title: "🔍 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗕𝗨́𝗦𝗤𝗨𝗘𝗗𝗔𝗦 🔍", description: "🌍 ꒰ 𝗕𝘂𝘀𝗰𝗮 𝗲𝗻 𝗹𝗶́𝗻𝗲𝗮 ꒱", id: `${_p}menubusquedas` }
            ]
        }];

        // --- MENSAJE INTERACTIVO ---
        const interactiveMessage = {
            header: {
                title: "",
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
            },
            body: { text: `${beforeText}\n\n${bodyText}` },
            footer: { text: "⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟𖹭 𝐁𖹭t͟𑁯ᰍ" },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "꒰꒰ 🍒 𝐌𝖾𝗇𝗎 𝐌𝖺𝗇𝗎𝖺𝗅 Ი꯭ᰍ",
                            id: `${_p}menumanual`
                        })
                    },
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: " ❀⃘⃛͜ ۪۪۪݃𓉘᳟ี ⃞̸͢𑁃 ̚𓉝᳟ี𝐌𝐄𝐍𝐔 𝐁𝐎𝐓❀⃘⃛͜",
                            sections: sections
                        })
                    }
                ]
            },
            // 🧪 INTENTO DE HACK: Contexto Falso 🧪
            // Intentamos decir que el mensaje es un "Forward" de la cuenta oficial de WhatsApp
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999999,
                isForwarded: true,
                participant: "0@s.whatsapp.net", // Intentamos engañar al cliente aquí
                remoteJid: "0@s.whatsapp.net",
                externalAdReply: {
                    showAdAttribution: true,
                    title: '𝖬𝖤𝖭𝖴 𝖫𝖨𝖲𝖳 • 𝖱𝖴𝖡𝖸',
                    body: 'Interactúa ahora',
                    thumbnailUrl: imageUrl,
                    sourceUrl: 'https://github.com/Dioneibi/Ruby-Bot',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        };

        // --- GENERACIÓN DEL PROTOCOLO ---
        let msgi = generateWAMessageFromContent(
            m.chat,
            { viewOnceMessage: { message: { interactiveMessage } } },
            { userJid: conn.user.jid, quoted: m }
        );

        // 🧪 INTENTO DE HACK: Modificar la llave del mensaje 🧪
        // Intentamos manipular el participante en el envío final
        // Nota: Si esto falla, es porque el servidor de WhatsApp valida la firma criptográfica.
        await conn.relayMessage(m.chat, msgi.message, { 
            messageId: msgi.key.id,
            participant: { jid: m.sender } // Aquí estamos obligados a poner tu JID real o da error de Auth
        });
        
        m.react('💞');

    } catch (e) {
        console.error(e);
        conn.reply(m.chat, `❌ Error: ${e}`, m);
    }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.register = true;
handler.command = ['menu', 'menú', 'listmenu'];

export default handler;

// Funciones
function clockString(ms) {
    let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    return [d, 'D', h, 'H', m, 'M'].map(v => v.toString().padStart(2, '0')).join(' ');
}

function ucapan() {
    const time = moment.tz('America/Lima').format('HH');
    if (time >= 5 && time < 12) return "𝘽𝙪𝙚𝙣𝙤𝙨 𝘿𝙞́𝙖𝙨 ☀️";
    if (time >= 12 && time < 18) return "𝘽𝙪𝙚𝙣𝙖𝙨 𝙏𝙖𝙧𝙙𝙚𝙨 🌤️";
    return "𝘽𝙪𝙚𝙣𝙖𝙨 𝙉𝙤𝙘𝙝𝙚𝙨 🌙";
}
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }