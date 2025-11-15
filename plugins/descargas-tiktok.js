import fetch from 'node-fetch';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const emoji = "🌸";

  const tiktokRegex = /^(https?:\/\/)?(www\.)?(vm\.tiktok\.com|tiktok\.com)\/.+/i;

  if (!args[0] || !tiktokRegex.test(args[0])) {
    return conn.reply(
      m.chat,
      `
${emoji} 𝑶𝒘𝒈~ 𝒏𝒐𝒏 𝒏𝒐𝒏... 𝒅𝒆𝒃𝒆𝒔 𝒖𝒔𝒂𝒓 𝒆𝒍 𝒄𝒐𝒎𝒂𝒏𝒅𝒐 𝒋𝒖𝒏𝒕𝒐 𝒂 𝒖𝒏 𝒆𝒏𝒍𝒂𝒄𝒆 𝒗𝒂𝒍𝒊𝒅𝒐 𝒅𝒆 𝑻𝒊𝒌𝑻𝒐𝒌 ✨

📌 *Ejemplo correcto:*  
» ${usedPrefix + command} https://vm.tiktok.com/XXXXXXXX/

(˘⌣˘ ) 𝑽𝒖𝒆𝒍𝒗𝒆 𝒂 𝒊𝒏𝒕𝒆𝒏𝒕𝒂𝒓 𝒄𝒐𝒏 𝒖𝒏 𝒍𝒊𝒏𝒌 𝒗𝒂𝒍𝒊𝒅𝒐
      `.trim(),
      m
    );
  }

  try {
    await conn.reply(
      m.chat,
      `${emoji} 𝑬𝒔𝒑𝒆𝒓𝒂 𝒍𝒊𝒏𝒅𝒐~ 𝒆𝒔𝒕𝒐𝒚 𝒃𝒂𝒋𝒂𝒏𝒅𝒐 𝒕𝒖 𝒗𝒊𝒅𝒆𝒊𝒕𝒐... 📥✨`,
      m
    );

    const tiktokData = await tiktokdl(args[0]);
    const result = tiktokData?.data;

    if (!result?.play) {
      return conn.reply(
        m.chat,
        `${emoji} ❌ 𝑼𝒑𝒔… 𝒏𝒐 𝒑𝒖𝒅𝒆 𝒐𝒃𝒕𝒆𝒏𝒆𝒓 𝒆𝒍 𝒗𝒊𝒅𝒆𝒐.`,
        m
      );
    }

    const caption = `
✦・﹤ 𝑻 𝑰 𝑲 𝑻 𝑶 𝑲  —  𝑫 𝑶 𝑾 𝑵 𝑳 𝑶 𝑨 𝑫 ﹥・✦

「${result.title || '✧ 𝑺𝒊𝒏 𝒕𝒊𝒕𝒖𝒍𝒐 ✧'}」

❀ 𝑨𝒖𝒕𝒐𝒓: ${result.author?.nickname || 'Desconocido'}
❀ 𝑫𝒖𝒓𝒂𝒄𝒊𝒐𝒏: ${result.duration || 0}s
❀ 𝑽𝒊𝒔𝒕𝒂𝒔: ${result.play_count || 0}
❀ 𝑳𝒊𝒌𝒆𝒔: ${result.digg_count || 0}
❀ 𝑪𝒐𝒎𝒆𝒏𝒕𝒂𝒓𝒊𝒐𝒔: ${result.comment_count || 0}
❀ 𝑪𝒐𝒎𝒑𝒂𝒓𝒕𝒊𝒅𝒐𝒔: ${result.share_count || 0}
❀ 𝑭𝒆𝒄𝒉𝒂: ${formatDate(result.create_time)}

╰★━━━━━━━━━━━━━━━━━━★╯
    `.trim();

    await conn.sendFile(m.chat, result.play, 'tiktok.mp4', caption, m);

    await m.react("🌸");
  } catch (e) {
    console.error(e);
    return conn.reply(
      m.chat,
      `❌ 𝑬𝒓𝒓𝒐𝒓 𝒂𝒍 𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂𝒓:\n${e.message}`,
      m
    );
  }
};

handler.help = ['tiktok', 'tt'].map(v => v + ' *<link>*');
handler.tags = ['descargas'];
handler.command = ['tiktok', 'tt', 'tiktokdl', 'ttdl'];
handler.group = true;
handler.register = true;

export default handler;

async function tiktokdl(url) {
  const api = `https://www.tikwm.com/api/?url=${url}&hd=1`;
  const res = await fetch(api);
  return await res.json();
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('es-ES', {
    timeZone: 'America/Mexico_City'
  });
}