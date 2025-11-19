let handler = async (m, { conn }) => {
  const texto = `
✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐠𝐚𝐜𝐡𝐚 𝐩𝐚𝐫𝐚 𝐫𝐞𝐜𝐥𝐚𝐦𝐚𝐫 𝐲 𝐜𝐨𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐚𝐫 𝐩𝐞𝐫𝐬𝐨𝐧𝐚𝐣𝐞𝐬 🎭🌟⊹

̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——  *#rollwaifu • #rw • #roll*
> ✦ Waifu o husbando aleatorio.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——  *#claim • #c • #reclamar*
> ✦ Reclamar un personaje.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——  *#harem • #waifus • #claims*
> ✦ Ver tus personajes reclamados.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——  *#charimage • #waifuimage • #wimage*
> ✦ Ver una imagen aleatoria de un personaje.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——  *#charinfo • #winfo • #waifuinfo*
> ✦ Ver información de un personaje.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——  *#givechar • #givewaifu • #regalar*
> ✦ Regalar un personaje a otro usuario.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——   ੈ₊˚༅༴│.ᰔᩚ *#vote • #votar*
> ✦ Votar por un personaje para subir su valor.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ——  *#waifusboard • #waifustop • #topwaifus*
> ✦ Ver el top de personajes con mayor valor.
ੈ₊˚༅༴╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
  `.trim();

  await conn.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/61219t.png' },
    caption: texto,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: 'Menu de comandos gacha 🍡',
        body: 'colecciona todos los personajes que puedas',
        thumbnailUrl: 'https://files.catbox.moe/hdr7oh.jpg',
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
        mediaUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        sourceUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        newsletterJid: '120363335626706839@newsletter',
        newsletterName: '⏤͟͞ू⃪፝͜⁞⟡『 𝙍𝙪𝙗𝙮 𝙃𝙤𝙨𝙝𝙞𝙣𝙤 𝘽𝙤𝙩 』࿐⟡'
      }
    }
  }, { quoted: m });
};

handler.command = ['menugacha'];
export default handler;