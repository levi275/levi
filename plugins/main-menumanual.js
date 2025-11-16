let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        let name = m.pushName || 'Aventurero';
        
        let lkr = `⋱⏜ֹ๋۪۪۪۪۪۪᷼︵̈⋱ֻ࡛࡛፟＼𑂳⚚／ֻ࡛𑂳࡛⋰̈︵ֹ๋۪۪۪۪۪۪᷼⏜⋰

  ᰍิ۪۪۪֟፝ᰍิ͚  ִּ֮   🌟 𝙈𝙀𝙉𝙐 𝙈𝘼𝙉𝙐𝘼𝙇 🌟   ִּ֮ 

(｡•ᴗ•)ﾉﾞ¡𝐇𝐨𝐥𝐚, ${name}! 💫
𝐄𝐬𝐭𝐨𝐬 𝐬𝐨𝐧 𝐥𝐚𝐬 𝐨𝐩𝐜𝐢𝐨𝐧𝐞𝘀 𝐝𝐞 𝐦𝐞𝐧𝐮́ 𝐪𝐮𝐞 𝐭𝐢𝐞𝐧𝐞 𝐥𝐚 𝐛𝐨𝐭

> ├┈・──・──・﹕₊˚ ✦・୨୧・
> │  ◦  ⚙️ _${usedPrefix}menumanual_
> ... (resto de tu menú decorado sigue igual) ...`;

        await conn.sendMessage(m.chat, {
            image: { url: 'https://telegra.ph/file/861d4dde6b2fd5f808183.jpg' },
            caption: lkr,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.channelRD,
                    newsletterName: global.canalNombreM,
                    serverMessageId: -1
                }
            }
        });

        await m.react('🌟'); 

    } catch (error) {
        // Envía el error al chat para que sepas qué falló
        await conn.reply(m.chat, `❌ Ocurrió un error en el comando *${command}*:\n\n${error}`, m);
        console.error(`Error en comando ${command}:`, error);
    }
}

handler.help = ['uni'];
handler.tags = ['main'];
handler.command = 'menumanual'; // usa string para compatibilidad
export default handler;
