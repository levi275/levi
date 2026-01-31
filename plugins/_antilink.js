// Mapas de caracteres Fancy (Negrita Cursiva y Sans Serif)
const fancyFontMap = {
  'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
  'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢', 'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
};

function toFancy(text) {
  return text.split('').map(char => fancyFontMap[char] || char).join('');
}

// Regex para enlaces de WhatsApp y Canales
let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
    if (!m.isGroup) return; 
    if (isAdmin || isOwner || m.fromMe || isROwner) return;

    let chat = global.db.data.chats[m.chat];
    let bot = global.db.data.settings[this.user.jid] || {};
    
    // Validar si antilink está activo
    if (!chat.antiLink) return;

    const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text);

    if (isGroupLink) {
        // Verificar si es el link del propio grupo (seguridad)
        if (isBotAdmin) {
            const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`;
            if (m.text.includes(linkThisGroup)) return;
        }

        // --- MODO RUBY HOSHINO ACTIVADO ---
        
        let user = m.sender;
        // Textos con personalidad Otaku/Idol
        // Usamos términos: Dame (No), Baka (Idiota), Yurusanai (No perdonaré), Sayonara (Adiós)
        
        let aviso = `🚫 *¡${toFancy('YAMEROOO')}!* (＞﹏＜)\n\n`;
        aviso += `📢 *${toFancy('Hey tú')}...* @${user.split('@')[0]}\n`;
        aviso += `😤 *${toFancy('Status')}:* ¡${toFancy('BAKA')}! Rompiste las reglas.\n`;
        aviso += `💢 *${toFancy('Razón')}:* ¡${toFancy('Dame')}! Nada de enlaces aquí.\n`;
        aviso += `👋 *${toFancy('Conclusión')}:* ¡${toFancy('Sayonara')}! No te lo perdonaré.\n\n`;
        aviso += `> ✨ _Ruby-Bot Security System_`;

        if (isBotAdmin) {
            // 1. Eliminar mensaje (Anti-Spam rápido)
            await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant } });

            // 2. Enviar Advertencia con Tarjeta Pequeña (Estilo Miniatura)
            await conn.sendMessage(m.chat, { 
                text: aviso, 
                contextInfo: { 
                    mentionedJid: [user],
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `⚡ 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞 𝗔𝗖𝗧𝗜𝗩𝗔𝗗𝗢 ⚡`,
                        body: '¡No envies links de otros grupos!',
                        // Usa una foto de Ruby Hoshino o tu Waifu
                        thumbnailUrl: 'https://i.pinimg.com/736x/f6/01/52/f601529dfc3e5dfd2946c764e525a74e.jpg', 
                        sourceUrl: 'https://whatsapp.com/channel/0029Va4QjTC77qVYjqZq3r1', // Tu canal si tienes
                        mediaType: 1,
                        renderLargerThumbnail: false // <--- ESTO HACE QUE LA FOTO SEA PEQUEÑA
                    }
                }
            }, { quoted: null });

            // 3. Eliminar Usuario
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
            
        } else {
            return m.reply(`(qwq) *Gomen ne...* El Antilink está activo pero no soy Admin, así que no puedo sacar al *Baka* que mandó el enlace.`);
        }
        return !0;
    }
    return !0;
}
