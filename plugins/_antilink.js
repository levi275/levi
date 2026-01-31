// Definimos el mapa de fuentes bonitas (Fancy Text)
const fancyFontMap = {
  'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
  'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢', 'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
};

function toFancy(text) {
  return text.split('').map(char => fancyFontMap[char] || char).join('');
}

// Regex para detectar enlaces de Grupos y Canales
let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
    // Si no es grupo, ignoramos
    if (!m.isGroup) return;
    
    // Obtenemos datos del chat y configuración
    let chat = global.db.data.chats[m.chat];
    let bot = global.db.data.settings[this.user.jid] || {};
    
    // Si eres admin, owner, o el bot mismo, ignoramos (inmunidad)
    if (isAdmin || isOwner || m.fromMe || isROwner) return;

    // Verificar si el antilink está activo en este chat
    if (!chat.antiLink) return;

    // Verificar si el mensaje contiene un link prohibido
    const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text);

    if (isGroupLink) {
        // Verificar si el link es DE ESTE MISMO GRUPO (para no banear por compartir el link del grupo actual)
        if (isBotAdmin) {
            const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`;
            if (m.text.includes(linkThisGroup)) return;
        }

        // --- INICIO DE LA DECORACIÓN Y ACCIÓN ---
        
        // 1. Texto Base decorado
        let user = m.sender;
        let aviso = `🛑 *¡${toFancy('ENLACE DETECTADO')}!* 🛑\n\n`;
        aviso += `👤 *${toFancy('Usuario')}:* @${user.split('@')[0]}\n`;
        aviso += `🚫 *${toFancy('Motivo')}:* ${toFancy('Enviar enlaces prohibidos')}\n`;
        aviso += `⚖️ *${toFancy('Acción')}:* ${toFancy('Eliminación inmediata')}\n\n`;
        aviso += `> 🔒 _El sistema de seguridad ha detectado una infracción._`;

        // 2. Si el Bot NO es admin, avisamos y salimos
        if (!isBotAdmin) {
            return m.reply(`⚠️ El *AntiLink* está activo, pero necesito ser *Admin* para eliminar a los infractores.`);
        }

        // 3. Ejecución: Borrar mensaje + Aviso Visual + Kick
        if (isBotAdmin) {
            // A. Borrar el mensaje original inmediatamente
            await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant } });

            // B. Enviar tarjeta decorada (External Ad Reply)
            // Puedes cambiar el 'thumbnailUrl' por una imagen de tu bot o un icono de alerta
            await conn.sendMessage(m.chat, { 
                text: aviso, 
                contextInfo: { 
                    mentionedJid: [user],
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `🛡️ 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 𝗦𝗬𝗦𝗧𝗘𝗠 🛡️`,
                        body: 'Tu Bot de Confianza',
                        thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png', // Icono de escudo rojo
                        sourceUrl: '', // Puedes poner tu canal aquí si quieres
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: null }); // quoted null para que se vea más limpio, o pon 'm' para citar al fantasma

            // C. Eliminar al usuario
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
        }
        return !0;
    }
    return !0;
}
