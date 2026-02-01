// ⁱ𝔇ĕ𝐬†𝓻⊙γ𒆜 - Versión "Solo lo que yo diga"
// >> https://github.com/The-King-Destroy

let handler = async (m, { text, usedPrefix, command }) => {
    const userId = m.sender;
    
    // Si no existe el usuario en la DB, lo creamos
    if (!global.db.data.users[userId]) global.db.data.users[userId] = {};
    const user = global.db.data.users[userId];

    const icons = {
        star: '✨',
        ok: '✅',
        error: '⚠️',
        knd: '🚀'
    };

    if (command === 'setmeta') {
        if (!text) {
            return m.reply(`*${icons.error} Uso correcto:*
            
➜ Solo Pack: \`${usedPrefix + command} MiNombre\`
➜ Solo Autor: \`${usedPrefix + command} • MiAutor\`
➜ Ambos: \`${usedPrefix + command} Pack • Autor\``);
        }

        // Dividimos el texto. 
        // Si pones "SoloNombre", authorInput será undefined.
        // Si pones "• SoloAutor", packInput será una cadena vacía.
        let [packInput, authorInput] = text.split(/[\u2022|]/).map(v => v ? v.trim() : '');

        let finalPack = '';
        let finalAuthor = '';

        if (text.includes('•') || text.includes('|')) {
            // Caso donde el usuario usó el separador
            finalPack = packInput || ''; // Si está vacío antes del punto, queda vacío
            finalAuthor = authorInput || ''; // Si está vacío después del punto, queda vacío
        } else {
            // Caso donde el usuario solo escribió texto plano (asumimos que es solo PACK)
            finalPack = text.trim();
            finalAuthor = ''; // Forzamos autor vacío para que no salga el nombre del bot
        }

        // Guardamos los cambios
        user.text1 = finalPack;
        user.text2 = finalAuthor;

        await global.db.write();

        // Mensaje de confirmación estético
        let info = `*${icons.star} ¡Configuración Aplicada!* ${icons.star}\n\n`;
        info += `📦 *Pack:* ${finalPack ? `「${finalPack}」` : '_Vacío_'}\n`;
        info += `👤 *Autor:* ${finalAuthor ? `「${finalAuthor}」` : '_Vacío_'}\n\n`;
        info += `> ${icons.knd} Ahora tus stickers solo tendrán esta información.`;

        return m.reply(info.trim());
    }

    if (command === 'delmeta') {
        if (!user.text1 && !user.text2) return m.reply(`${icons.error} No tienes datos guardados.`);
        
        delete user.text1;
        delete user.text2;
        await global.db.write();
        
        return m.reply(`${icons.ok} Se han restablecido los valores por defecto.`);
    }
};

handler.help = ['setmeta', 'delmeta'];
handler.tags = ['tools'];
handler.command = ['setmeta', 'delmeta'];
handler.register = true;

export default handler;