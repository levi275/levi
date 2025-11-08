export async function before(m) {
  if (!m.text || !global.prefix.test(m.text)) return;

  const usedPrefix = global.prefix.exec(m.text)[0];
  const command = m.text.slice(usedPrefix.length).trim().split(' ')[0].toLowerCase();

  const validCommand = (command, plugins) => {
    for (let plugin of Object.values(plugins)) {
      if (plugin.command && (Array.isArray(plugin.command) ? plugin.command : [plugin.command]).includes(command)) {
        return true;
      }
    }
    return false;
  };

  if (!command) return;

  if (command === "bot") return;

  if (validCommand(command, global.plugins)) {
    let chat = global.db.data.chats[m.chat];
    let user = global.db.data.users[m.sender];

    if (chat.isBanned) {
      const avisoDesactivado = `🍧 La bot *${botname}* está desactivada en este grupo.\n\n> ✦ Un *administrador* puede activarla con el comando:\n> » *${usedPrefix}bot on*`;
      await m.reply(avisoDesactivado);
      return;
    }

    if (!user.commands) user.commands = 0;
    user.commands += 1;

  } else {
    let fkontak = null;
    try {
      const res = await fetch('https://i.postimg.cc/nhdkndD6/pngtree-yellow-bell-ringing-with-sound-waves-png-image-20687908.png');
      const thumb2 = Buffer.from(await res.arrayBuffer());
      fkontak = {
        key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
        message: {
          locationMessage: {
            name: `𝙉𝙤 𝙨𝙚 𝙝𝙖 𝙚𝙣𝙘𝙤𝙣𝙩𝙧𝙖𝙙𝙤`,
            jpegThumbnail: thumb2
          }
        },
        participant: '0@s.whatsapp.net'
      };
    } catch {}

    const comando = m.text.trim().split(' ')[0];

    const msjDecorado =
`(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ᥴ᥆mᥲᥒძ᥆ *${comando}* ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ rᥱgіs𝗍rᥲძ᥆. ᥱs ⍴᥆sіᑲᥣᥱ 𝗊ᥙᥱ ᥱs𝗍ᥱ mᥲᥣ ᥱsᥴrі𝗍᥆ ᥆ ᥒ᥆ ᥱ᥊іs𝗍ᥲ.

⍴ᥲrᥲ ᥴ᥆ᥒsᥙᥣ𝗍ᥲr ᥣᥲ ᥣіs𝗍ᥲ ᥴ᥆m⍴ᥣᥱ𝗍ᥲ ძᥱ 𝖿ᥙᥒᥴі᥆ᥒᥲᥣіძᥲძᥱs ᥙsᥲ:
» *${usedPrefix}help*`;

    await m.reply(msjDecorado, fkontak);
  }
}
