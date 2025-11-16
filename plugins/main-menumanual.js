import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command }) => {
try {
let name = m.pushName||'Aventurero'
let lkr = `⋱⏜ֹ๋۪۪۪۪۪۪᷼︵̈⋱ֻ࡛...resto del texto...`

let res = await fetch('https://raw.githubusercontent.com/levi275/img/main/Merry-christmas4.jpeg')
let buffer = Buffer.from(await res.arrayBuffer())

await conn.sendMessage(m.chat, {
  image: buffer,
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
})

await m.react('🌟')
} catch(e) {
  await conn.reply(m.chat, `❌ Ocurrió un error en el comando *${command}*:\n\n${e}`, m)
  console.error(e)
}
}

handler.help = ['uni']
handler.tags = ['main']
handler.command = ['menumanual']
export default handler
