import { fbdl } from 'ruhend-scraper'

var handler = async (m, { conn, args, command, usedPrefix, text }) => {

  const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command);

  async function reportError(e) {
      await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m);
      console.log(`⁖💚꙰ 𝙴𝚁𝚁𝙾𝚁 𝙴𝙽: ${usedPrefix + command} ⚠️\n`);
      console.log(e);
  }

  if (!isCommand7) return;

  if (!args[0]) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Facebook*\n\nEjemplo: ${usedPrefix}fb https://fb.watch/kAOXy3wf2L/?mibextid=Nif5oz`, m);
  if (!args[0].match(/www.facebook.com|fb.watch|web.facebook.com|business.facebook.com|video.fb.com/g)) return conn.reply(m.chat, '🚩 *Enlace de Facebook inválido*', m);

  conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗩𝗶𝗱𝗲𝗼 𝗗𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸, 𝗲𝘀𝗽𝗲𝗿𝗲 𝗽𝗼𝗿 𝗳𝗮𝘃𝗼𝗿...', m);

  let messageType = checkMessageType(args[0]);
  let messageText = '';
  switch (messageType) {
    case 'groups': messageText = `𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗴𝗿𝘂𝗽𝗼 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰`; break;
    case 'reel': messageText = `𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗿𝗲𝗲𝗹𝘀 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰`; break;
    case 'stories': messageText = `𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗵𝗶𝘀𝘁𝗼𝗿𝗶𝗮𝘀 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰`; break;
    case 'posts': messageText = `𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗽𝗹𝘂𝗯𝗹𝗶𝗰𝗮𝗰𝗶𝗼𝗻𝗲𝘀 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰`; break;
    default: messageText = `𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰`; break;
  }

  try {
      const res = await fbdl(args[0]);
      const data = res.data;

      let videos = [];
      if (Array.isArray(data)) {
          videos = data.map(v => v.video_hd || v.hd || v.video_sd || v.sd || v.url).filter(Boolean);
      } else {
          let videoUrl = data.video_hd || data.hd || data.video_sd || data.sd || data.url;
          if (videoUrl) videos.push(videoUrl);
      }

      if (!videos.length) throw new Error('No se pudo extraer un enlace de video válido.');

      for (let video of videos) {
          await conn.sendFile(m.chat, video, 'facebook.mp4', `${messageText}\n${global.wm}`, m);
      }

  } catch (e) {
      reportError(e);
  }
}

handler.help = ['fb'];
handler.tags = ['descargas'];
handler.command = /^(facebook|fb|facebookdl|fbdl)$/i;
handler.register = true;

export default handler;

function checkMessageType(url) {
  if (url.includes('www.facebook.com')) {
      if (url.includes('/groups/')) return 'groups';
      else if (url.includes('/reel/')) return 'reel';
      else if (url.includes('/stories/')) return 'stories';
      else if (url.includes('/posts/')) return 'posts';
  }
  return 'default';
}
