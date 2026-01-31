// Mapas de caracteres Fancy
const fancyFontMap = {
  'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
  'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢', 'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
};

function toFancy(text) {
  return text.split('').map(char => fancyFontMap[char] || char).join('');
}

// Regex para enlaces
let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
    if (!m.isGroup) return; 
    if (isAdmin || m.fromMe) return;

    let chat = global.db.data.chats[m.chat];
    
    // Validar si antilink está activo
    if (!chat.antiLink) return;

    const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text);

    if (isGroupLink) {
        // Verificar si es el link del propio grupo
        if (isBotAdmin) {
            const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`;
            if (m.text.includes(linkThisGroup)) return;
        }

        // --- MODO RUBY: CLARO Y DIRECTO ---
        
        let user = m.sender;
        
        // Mensaje fluido, sin etiquetas "Status:" ni "Razón:"
        // Directo al grano: Te vi -> Rompiste las reglas -> Te vas.
        let aviso = `🚫 *¡${toFancy('YAMEROOO')}!* (＞﹏＜)\n\n`;
        aviso += `👀 @${user.split('@')[0]}, *${toFancy('acabas de enviar un enlace prohibido')}.*\n\n`;
        aviso += `😤 *${toFancy('Las reglas son claras')}:* nada links de otros grupos aquí, eso no es genial.\n\n`;
        aviso += `👋 *${toFancy('Lo siento, pero Sayonara')}...* (oT-T)尸`;

        if (isBotAdmin) {
            // 1. Eliminar mensaje primero
            await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant } });

            // 2. Enviar Advertencia con Tarjeta Pequeña
            await conn.sendMessage(m.chat, { 
                text: aviso, 
                contextInfo: { 
                    mentionedJid: [user],
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `⚡ 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞 𝗔𝗖𝗧𝗜𝗩𝗢 ⚡`, // Título llamativo
                        body: '¡NO ENVIES LINKS AQUI!', // Cuerpo simple
                        thumbnailUrl: 'https://i.pinimg.com/736x/ac/12/6f/ac126f05f2040dd944a4a9d653f84206.jpg', // Foto Ruby
                        sourceUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P', 
                        mediaType: 1,
                        renderLargerThumbnail: false // FALSE = Icono pequeño a la derecha
                    }
                }
            }, { quoted: null });

            // 3. Eliminar Usuario
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
            
        } else {
            return m.reply(`😓 *Ups...* El antilink está activo, pero necesito ser *Admin* para poder sacar a la gente que manda spam.`);
        }
        return !0;
    }
    return !0;
}
