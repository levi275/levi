// ⁱ𝔇ĕ𝐬†𝓻⊙γ𒆜 - Mejorado por tu Asistente de IA
// >> https://github.com/The-King-Destroy

let handler = async (m, { text, usedPrefix, command }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId] || {};

    // Emojis y decoración Otaku/Aesthetic
    const icons = {
        success: '✧⁠*⁠。',
        error: '(⁠ ⁠･ั⁠﹏⁠･ั⁠)',
        alert: '!!',
        write: '✎⁠',
        trash: '🗑️'
    };

    if (command === 'setmeta') {
        // Si no hay texto, mostramos instrucciones claras y bonitas
        if (!text) {
            return m.reply(`
╭━━━〔 *STICKER METADATA* 〕━━━⬣
┃ ${icons.alert} *Instrucciones:*
┃ Configura tu marca personal en los stickers.
┃
┃ ${icons.write} *Modos de uso:*
┃ ❶ *Pack y Autor:*
┃ ➜ ${usedPrefix}setmeta PackName • AuthorName
┃
┃ ❷ *Solo Pack:*
┃ ➜ ${usedPrefix}setmeta SoloElPack
┃
┃ ❸ *Solo Autor:*
┃ ➜ ${usedPrefix}setmeta • SoloElAutor
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`.trim());
        }

        // Expresión regular para dividir por "•" o "|"
        let [packInput, authorInput] = text.split(/[\u2022|]/).map(v => v ? v.trim() : '');

        // Lógica de "Merge" (Mezcla inteligente)
        // Si el usuario pone "• Autor", packInput será "" (vacío).
        // Si packInput está vacío, mantenemos el que ya tenía antes, o usamos uno por defecto.
        let newPack = packInput || user.text1 || 'Sticker';
        let newAuthor = authorInput || user.text2 || '';

        // Caso especial: Si el usuario NO usó separador (solo texto), asumimos que es el Pack
        // pero si ya tenía autor, lo conservamos.
        if (!text.includes('•') && !text.includes('|')) {
             newPack = text.trim();
             newAuthor = user.text2 || ''; // Conservar autor previo si existe
        }

        // Guardamos en la base de datos
        if (!global.db.data.users[userId]) global.db.data.users[userId] = {};
        global.db.data.users[userId].text1 = newPack;
        global.db.data.users[userId].text2 = newAuthor;

        await global.db.write();

        return m.reply(`
╭━━━〔 *CONFIGURADO* 〕━━━⬣
┃ ${icons.success} ¡Sugoi! Tus datos se han guardado.
┃
┃ 📦 *Pack:* 「 ${newPack} 」
┃ 👤 *Autor:* 「 ${newAuthor} 」
╰━━━━━━━━━━━━━━━━━━━━⬣
`.trim());
    }

    if (command === 'delmeta') {
        // Verificamos si tiene datos
        if (!user.text1 && !user.text2) {
            return m.reply(`${icons.error} Etto... No tienes ninguna configuración guardada para borrar.`);
        }

        // Borramos
        delete global.db.data.users[userId].text1;
        delete global.db.data.users[userId].text2;

        await global.db.write();

        return m.reply(`${icons.trash} *Sayonara!* Se han eliminado tus datos de sticker por defecto.`);
    }
};

handler.help = ['setmeta', 'delmeta'];
handler.tags = ['tools'];
handler.command = ['setmeta', 'delmeta'];
handler.register = true;
// handler.group = true // Opcional: si quieres que funcione en privado, comenta esto.

export default handler;