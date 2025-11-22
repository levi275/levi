import fetch from 'node-fetch';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  // Validaciones de texto y link
  if (!text) throw `_*< DESCARGAS - TIKTOK />*_\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ Vɪᴅᴇᴏ Dᴇ TɪᴋTᴏᴋ.*\n\n*💌 Eᴊᴇᴍᴘʟᴏ:* _${usedPrefix + command} https://vm.tiktok.com/ZM6UHJYtE/_`;
  if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) throw `*< DESCARGAS - TIKTOK />*\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ Vɪᴅᴇᴏ Dᴇ Tɪᴋᴛᴏᴋ.*\n\n*💌 Eᴊᴇᴍᴘʟᴏ:* _${usedPrefix + command} https://vm.tiktok.com/ZM6UHJYtE /_`;

  const texto = `_💌 @${m.sender.split`@`[0]}  ᩭ✎Enviando Video, espere un momento...._`;

  try {
    m.react('🕒');
    
    // Mensaje de espera (diseño original conservado)
    const aa = { quoted: m, userJid: conn.user.jid };
    const prep = generateWAMessageFromContent(m.chat, { 
        extendedTextMessage: { 
            text: texto, 
            contextInfo: { 
                externalAdReply: { title: packname, body: wm, thumbnail: icons, sourceUrl: yt }, 
                mentionedJid: [m.sender] 
            } 
        } 
    }, aa);
    await conn.relayMessage(m.chat, prep.message, { messageId: prep.key.id, mentions: [m.sender] });

    // --- MÉTODO DE DESCARGA (TikWM) ---
    const dataTik = await tiktokdl(args[0]);
    const result = dataTik?.data;

    if (!result || !result.play) {
        throw new Error("No se pudo obtener el video.");
    }

    const desc1n = `_💌  ᩭ✎Tiktok sin marca de agua descargado con éxito_`;
    await conn.sendMessage(m.chat, { video: { url: result.play }, caption: desc1n }, { quoted: fkontak });

  } catch (e) {
    throw `_*< DESCARGAS - TIKTOK />*_\n\n*🌟 Ocurrió un error. Por favor, inténtalo de nuevo más tarde.*`;
  }
};

handler.tags = ['descargas'];
handler.help = ['tiktok'];
handler.command = ['tiktok', 'tt', 'tiktokdl', 'ttdl'];
handler.register = true;

export default handler;

// Función auxiliar limpia
async function tiktokdl(url) {
  const api = `https://www.tikwm.com/api/?url=${url}&hd=1`;
  const res = await fetch(api);
  return await res.json();
}