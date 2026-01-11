import { WAMessageStubType } from '@whiskeysockets/baileys'
import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile } from 'fs'

const terminalImage = global.opts['img'] ? require('terminal-image') : ''
const urlRegex = (await import('url-regex-safe')).default({ strict: false })

export default async function(m, conn = { user: {} }) {
    if (m.key.remoteJid === 'status@broadcast') return
    let _name = await conn.getName(m.sender)
    let sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') + (_name ? ' ~' + chalk.magenta.bold(_name) : '')
    let chat = await conn.getName(m.chat)
    let img
    try {
        if (global.opts['img']) {
            img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false
        }
    } catch (e) {}
    
    let filesize = 0
    try {
        filesize = (m.msg ? (m.msg.vcard ? m.msg.vcard.length : m.msg.fileLength ? (m.msg.fileLength.low || m.msg.fileLength) : m.text ? m.text.length : 0) : m.text ? m.text.length : 0) || 0
    } catch (e) { filesize = 0 }

    let user = global.db.data.users[m.sender]
    let me = PhoneNumber('+' + (conn.user?.jid).replace('@s.whatsapp.net', '')).getNumber('international')
    let oraAttuale = new Date()
    let oraFormattata = oraAttuale.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    let chatName = chat ? (m.isGroup ? 'ᧉ꯭ꭑ꯭ᑲᧉɾ' : 'ρ꯭ꭑ') : 'υ꯭ꬻ𝗄꯭ꬻ꯭ꮎꭐꬻ'
    let messageType = m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg.ptt ? '𝗏𝗈𝗂𝖼𝖾' : '𝖺𝗎𝖽𝗂𝗈').toLowerCase() : '𝗌𝗒𝗌𝗍𝖾𝗆'
    
    let userInfo = user ? `${user.exp} 𝖾𝗑ρ ᎒ 𝗅𝗏𝗅 ${user.level}` : '𝗇𝖾ꭐ 𝗎𝗌𝖾𝗋'

    console.log(chalk.magenta(`\n   ` + `๖๖ ׂ ݂  ☁️・☁️・☁️ ݂ ׂ ๖๖`))
    console.log(chalk.cyan(`  ` + `ֵ ࡛ׄ ᮢ ⁔ ׄ᷼ ⁔╲)╲)`))
    
    console.log(chalk.white(`  ⢏⢢⣀⡔⡹ 🎀⃝├┄᎒ 𝖻۪ᦅ۪𝗍۪ 𝗂۪ꬻ۪𝖿۪ᦅ۪ ᎒┄┤`))
    console.log(chalk.magenta(`  ਏਓ 🎐⃞  ` + chalk.white(`𝗎𝗌𝖾𝗋: ${me}`)))
    console.log(chalk.magenta(`  └┄─━݄̊̊ ✧ ׂ ` + chalk.gray(`${oraFormattata} ᎒ ${messageType}`)))

    console.log(chalk.white(`  ⢏⢢⣀⡔⡹ ☁️⃝├┄᎒ 𝗎۪𝗌۪𝖾۪𝗋۪ 𝗂۪ꬻ۪𝖿۪ᦅ۪ ᎒┄┤`))
    console.log(chalk.cyan(`  ਏਓ 💎⃞  ` + chalk.white(`𝖿𝗋ᦅꭑ: ${sender}`)))
    console.log(chalk.cyan(`  └┄─━݄̊̊ ✧ ׂ ` + chalk.gray(`${userInfo}`)))

    console.log(chalk.white(`  ⢏⢢⣀⡔⡹ 🍭⃝├┄᎒ 𝖼۪𝗁۪𝖺۪𝗍۪ 𝗂۪ꬻ۪𝖿۪ᦅ۪ ᎒┄┤`))
    console.log(chalk.magenta(`  ਏਓ 🎀⃞  ` + chalk.white(`𝗅ᦅ𝖼: ${chatName}`)))
    console.log(chalk.magenta(`  └┄─━݄̊̊ ✧ ׂ ` + chalk.gray(`𝗌𝗂𝗓𝖾: ${(filesize / 1024).toFixed(2)} kb`)))
    
    console.log(chalk.cyan(`  ` + `ꆭꆬ ẜẜ 𝗈𝗉𝖾𝗇 ꆬꆭ`))

    if (img) console.log(img.trimEnd())

    if (typeof m.text === 'string' && m.text) {
        let log = m.text.replace(/\u200e+/g, '')
        let prefix = m.error != null ? chalk.red('  ⊘ 𝖾𝗋𝗋ᦅ𝗋: ') : m.isCommand ? chalk.magenta('  ✦ 𝖼ᦅꭑꭑ𝖺ꬻ𝖽: ') : chalk.cyan('  💬 ꭑ𝖾𝗌𝗌𝖺𝗀𝖾: ')
        console.log(prefix + chalk.white(log))
    }
    console.log(chalk.gray(`  © Cbytzu ᎒ 𝖺𝖾𝗌𝗍𝗁𝖾𝗍𝗂𝖼 𝗉𝗋𝗂ꬻ𝗍\n`))
}

let file = global.__filename(import.meta.url)
watchFile(file, () => { console.log(chalk.magenta("  ๖๖ ׂ 𝗋𝖾𝖿𝗋𝖾𝗌𝗁𝖾𝖽...")) })
