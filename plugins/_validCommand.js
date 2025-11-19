import fetch from 'node-fetch'; // ⬅️ AGREGAR ESTA LÍNEA si no tienes 'fetch' globalmente

export async function before(m) {
  if (!m.text || !global.prefix.test(m.text)) return;

  const usedPrefix = global.prefix.exec(m.text)[0];
  const command = m.text.slice(usedPrefix.length).trim().split(' ')[0].toLowerCase();

  const validCommand = (command, plugins) => {
    for (let plugin of Object.values(plugins)) {
      // Asegura que plugin.command no sea null/undefined antes de acceder a sus propiedades
      if (plugin.command) { 
        const commandList = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        if (commandList.includes(command)) {
          return true;
        }
      }
    }
    return false;
  };

  if (!command) return;

  // Si el comando es "bot" no hacemos nada más, permitimos que se procese
  if (command === "bot") return; 

  if (validCommand(command, global.plugins)) {
    // --- Lógica para comandos válidos ---
    let chat = global.db.data.chats[m.chat];
    let user = global.db.data.users[m.sender];

    if (chat && chat.isBanned) { // ⬅️ Verificar que 'chat' exista antes de acceder a 'isBanned'
      const avisoDesactivado = `🍧 La bot *${global.botname}* está desactivada en este grupo.\n\n> ✦ Un *administrador* puede activarla con el comando:\n> » *${usedPrefix}bot on*`;
      await m.reply(avisoDesactivado);
      return;
    }

    if (user) { // ⬅️ Verificar que 'user' exista
      if (!user.commands) user.commands = 0;
      user.commands += 1;
    } else {
        // Manejar el caso donde el usuario no existe en la base de datos si es necesario
    }

  } else {
    // --- Lógica para comandos no válidos (Mensaje de error) ---
    let fkontak = null;
    try {
      // Intentamos obtener la imagen, pero si falla, no causará un error fatal
      const res = await fetch('https://i.postimg.cc/nhdkndD6/pngtree-yellow-bell-ringing-with-sound-waves-png-image-20687908.png');
      
      if (res.ok) { // ⬅️ SOLO CONTINUAR SI LA RESPUESTA HTTP ES EXITOSA (código 200-299)
          const thumb2 = Buffer.from(await res.arrayBuffer());
          fkontak = {
            key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
            message: {
              locationMessage: {
                name: `𝙉𝙤 𝙨𝙚 h𝙖 𝙚𝙣𝙘𝙤𝙣𝙩𝙧𝙖𝙙𝙤`,
                jpegThumbnail: thumb2
              }
            },
            participant: '0@s.whatsapp.net'
          };
      }
    } catch (e) {
        console.error("Fallo al obtener la imagen para el mensaje de error:", e);
        // 'fkontak' sigue siendo null, lo que está bien para prevenir el crash
    }

    const comando = m.text.trim().split(' ')[0]; // Usamos la primera palabra del texto original

    const msjDecorado =
`(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ᥴ᥆mᥲᥒძ᥆ *${comando}* ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ rᥱgіs𝗍rᥲძ᥆. ᥱs ⍴᥆sіᑲᥣᥱ 𝗊ᥙᥱ ᥱs𝗍ᥱ mᥲᥣ ᥱsᥴrі𝗍᥆ ᥆ ᥒ᥆ ᥱ᥊іs𝗍ᥲ.

⍴ᥲrᥲ ᥴ᥆ᥒsᥙᥣ𝗍ᥲr ᥣᥲ ᥣіs𝗍ᥲ ᥴ᥆m⍴ᥣᥱ𝗍ᥲ ძᥱ 𝖿ᥙᥒᥴі᥆ᥒᥲᥣіძᥲძᥱs ᥙsᥲ:
» *${usedPrefix}help*`;

    // Si 'fkontak' es null, el mensaje se enviará sin el contexto del 'locationMessage'
    await m.reply(msjDecorado, null, { contextInfo: fkontak ? fkontak : {} }); 
    // Usamos contextInfo para mantener el objeto si existe, o un objeto vacío si no.
    // Aunque m.reply suele aceptar fkontak directamente, esta forma es más segura.
  }
}