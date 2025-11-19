/*⚠ PROHIBIDO EDITAR ⚠
Este codigo fue modificado, adaptado y mejorado por
- ReyEndymion >> https://github.com/ReyEndymion
El codigo de este archivo esta inspirado en el codigo original de:
- Aiden_NotLogic >> https://github.com/ferhacks
*El archivo original del MysticBot-MD fue liberado en mayo del 2024 aceptando su liberacion*
El codigo de este archivo fue parchado en su momento por:
- BrunoSobrino >> https://github.com/BrunoSobrino
Contenido adaptado por:
- GataNina-Li >> https://github.com/GataNina-Li
- elrebelde21 >> https://github.com/elrebelde21
*/

const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = (await import("@whiskeysockets/baileys"));
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util'
import * as ws from 'ws'
const { child, spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = ""
let drm2 = ""
let rtx = "*\n\n✐ Cσɳҽxισɳ SυႦ-Bσƚ Mσԃҽ QR\n\n✰ Con otro celular o en la PC escanea este QR para convertirte en un *Sub-Bot* Temporal.\n\n\`1\` » Haga clic en los tres puntos en la esquina superior derecha\n\n\`2\` » Toque dispositivos vinculados\n\n\`3\` » Escanee este codigo QR para iniciar sesion con el bot\n\n✧ ¡Este código QR expira en 45 segundos!."

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const RubyJBOptions = {}
if (global.conns instanceof Array) console.log()
else global.conns = []

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    // Limitar el spam de intentos de conexión
    let time = global.db.data.users[m.sender].Subs + 120000
    if (new Date - global.db.data.users[m.sender].Subs < 120000) return conn.reply(m.chat, `${emoji} Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)

    const limiteSubBots = global.subbotlimitt || 20;
    // Filtrado optimizado de conexiones muertas
    const subBots = global.conns.filter((c) => c.user && c.ws?.socket?.readyState === ws.OPEN)
    const subBotsCount = subBots.length

    if (subBotsCount >= limiteSubBots) {
        return m.reply(`${emoji2} Se ha alcanzado o superado el límite de *Sub-Bots* activos (${subBotsCount}/${limiteSubBots}).\n\nNo se pueden crear más conexiones hasta que un Sub-Bot se desconecte.`)
    }

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let id = `${who.split`@`[0]}`
    let pathRubyJadiBot = path.join(`./${jadi}/`, id)
    
    if (!fs.existsSync(pathRubyJadiBot)) {
        fs.mkdirSync(pathRubyJadiBot, { recursive: true })
    }
    
    RubyJBOptions.pathRubyJadiBot = pathRubyJadiBot
    RubyJBOptions.m = m
    RubyJBOptions.conn = conn
    RubyJBOptions.args = args
    RubyJBOptions.usedPrefix = usedPrefix
    RubyJBOptions.command = command
    RubyJBOptions.fromCommand = true
    RubyJadiBot(RubyJBOptions)
    global.db.data.users[m.sender].Subs = new Date * 1
}

handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler

export async function RubyJadiBot(options) {
    let { pathRubyJadiBot, m, conn, args, usedPrefix, command } = options
    if (command === 'code') {
        command = 'qr';
        args.unshift('code')
    }
    
    const mcode = args[0] && /(--code|code)/.test(args[0].trim()) ? true : args[1] && /(--code|code)/.test(args[1].trim()) ? true : false
    let txtCode, codeBot, txtQR

    if (mcode) {
        args[0] = args[0].replace(/^--code$|^code$/, "").trim()
        if (args[1]) args[1] = args[1].replace(/^--code$|^code$/, "").trim()
        if (args[0] == "") args[0] = undefined
    }

    const pathCreds = path.join(pathRubyJadiBot, "creds.json")
    if (!fs.existsSync(pathRubyJadiBot)) {
        fs.mkdirSync(pathRubyJadiBot, { recursive: true })
    }

    try {
        args[0] && args[0] != undefined ? fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t')) : ""
    } catch {
        conn.reply(m.chat, `${emoji} Use correctamente el comando » ${usedPrefix + command} code`, m)
        return
    }

    const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
    
    // Exec se mantiene por compatibilidad con el sistema original, pero su impacto es mínimo aquí.
    exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
        const drmer = Buffer.from(drm1 + drm2, `base64`)
        let { version, isLatest } = await fetchLatestBaileysVersion()
        
        // Caché compartido para evitar leaks, o limpiado al desconectar
        const msgRetryCache = new NodeCache() 
        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathRubyJadiBot)

        const connectionOptions = {
            logger: pino({ level: "fatal" }), // Mantenemos fatal para reducir logs en consola
            printQRInTerminal: false,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
            msgRetryCache,
            browser: mcode ? ['Ubuntu', 'Chrome', '110.0.5585.95'] : ['Ruby Hoshino (Sub Bot)', 'Chrome', '2.0.0'],
            version: version,
            generateHighQualityLinkPreview: true,
            // Optimizaciones adicionales de socket
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            fireInitQueries: true,
            syncFullHistory: false // Evita sincronizar todo el historial si no es necesario (ahorra RAM)
        };

        let sock = makeWASocket(connectionOptions)
        sock.isInit = false
        let isInit = true

        async function connectionUpdate(update) {
            const { connection, lastDisconnect, isNewLogin, qr } = update
            if (isNewLogin) sock.isInit = false
            
            if (qr && !mcode) {
                if (m?.chat) {
                    txtQR = await conn.sendMessage(m.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: rtx.trim() }, { quoted: m })
                } else {
                    return
                }
                if (txtQR && txtQR.key) {
                    setTimeout(() => { conn.sendMessage(m.sender, { delete: txtQR.key }).catch(() => {}) }, 45000)
                }
                return
            }
            
            if (qr && mcode) {
                const rawCode = await sock.requestPairingCode(m.sender.split`@`[0], "RUBYCHAN");
                const interactiveButtons = [{
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Copiar Código",
                        id: "copy-jadibot-code",
                        copy_code: rawCode
                    })
                }];
                const interactiveMessage = {
                    image: { url: "https://files.catbox.moe/7xbyyf.jpg" },
                    caption: `*✨ ¡Tu código de vinculación está listo! ✨*\n\nUsa el siguiente código para conectarte como Sub-Bot:\n\n*Código:* ${rawCode.match(/.{1,4}/g)?.join("-")}\n\n> Haz clic en el botón de abajo para copiarlo fácilmente.`,
                    title: "Código de Vinculación",
                    footer: "Este código expirará en 45 segundos.",
                    interactiveButtons
                };
                const sentMsg = await conn.sendMessage(m.chat, interactiveMessage, { quoted: m });
                if (sentMsg && sentMsg.key) {
                    setTimeout(() => { conn.sendMessage(m.chat, { delete: sentMsg.key }).catch(() => {}) }, 45000);
                }
                return;
            }

            if (txtCode && txtCode.key) {
                setTimeout(() => { conn.sendMessage(m.sender, { delete: txtCode.key }).catch(() => {}) }, 45000)
            }
            if (codeBot && codeBot.key) {
                setTimeout(() => { conn.sendMessage(m.sender, { delete: codeBot.key }).catch(() => {}) }, 45000)
            }

            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
            
            // Lógica de reconexión optimizada
            if (connection === 'close') {
                // console.log(chalk.yellow(`Conexión cerrada: ${reason}`)); // Debug opcional
                if (reason === 428 || reason === 408 || reason === 515) {
                     console.log(chalk.bold.magentaBright(`\n[SUB-BOT] Reconectando (+${path.basename(pathRubyJadiBot)})...`))
                    await creloadHandler(true).catch(console.error)
                } else if (reason === 440 || reason === 405 || reason === 403 || reason === 401) {
                    console.log(chalk.bold.redBright(`\n[SUB-BOT] Sesión cerrada o inválida (+${path.basename(pathRubyJadiBot)})`))
                    try { fs.rmdirSync(pathRubyJadiBot, { recursive: true }) } catch {}
                    // Limpieza de memoria
                    sock.ev.removeAllListeners()
                    let i = global.conns.indexOf(sock)
                    if (i >= 0) global.conns.splice(i, 1)
                } else if (reason === 500) {
                     console.log(chalk.bold.magentaBright(`\n[SUB-BOT] Error 500 (+${path.basename(pathRubyJadiBot)}). Reintentando...`))
                    return creloadHandler(true).catch(console.error)
                } else {
                    // Desconexión desconocida o logout
                    try { sock.ws.close() } catch { }
                    sock.ev.removeAllListeners()
                    let i = global.conns.indexOf(sock)
                    if (i >= 0) global.conns.splice(i, 1)
                }
            }

            if (global.db.data == null) loadDatabase()
            if (connection == `open`) {
                if (!global.db.data?.users) loadDatabase()
                let userName = sock.authState.creds.me.name || 'Anónimo'
                // let userJid = sock.authState.creds.me.jid || `${path.basename(pathRubyJadiBot)}@s.whatsapp.net`
                console.log(chalk.bold.cyanBright(`\n❒⸺⸺⸺⸺【• SUB-BOT •】⸺⸺⸺⸺❒\n│\n│ 🟢 ${userName} (+${path.basename(pathRubyJadiBot)}) conectado.\n│\n❒⸺⸺⸺【• CONECTADO •】⸺⸺⸺❒`))
                sock.isInit = true
                global.conns.push(sock)
                await joinChannels(sock)
                m?.chat ? await conn.sendMessage(m.chat, { text: args[0] ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : `@${m.sender.split('@')[0]}, genial ya eres parte de nuestra familia de Sub-Bots.`, mentions: [m.sender] }, { quoted: m }) : ''
            }
        }

        // Intervalo de limpieza optimizado
        setInterval(async () => {
            if (!sock.user) {
                try { sock.ws.close() } catch (e) {}
                sock.ev.removeAllListeners()
                let i = global.conns.indexOf(sock)
                if (i >= 0) {
                    delete global.conns[i]
                    global.conns.splice(i, 1)
                }
            }
        }, 60000)

        // OPTIMIZACIÓN CRÍTICA: Carga del handler
        // Evitamos importar el handler repetidamente con cache busting
        let creloadHandler = async function (restatConn) {
            try {
                 // Solo usamos el handler global si existe, evitamos 'require' masivos
                const handlerModule = await import('../handler.js')
                // Si hay actualizaciones globales en handler.js, se tomarán, pero no forzamos recarga por cada subbot
                if (handlerModule) sock.handler = handlerModule.handler.bind(sock)
            } catch (e) {
                console.error('⚠️ Nuevo error en handler: ', e)
            }

            if (restatConn) {
                try { sock.ws.close() } catch { }
                sock.ev.removeAllListeners()
                sock = makeWASocket(connectionOptions)
                isInit = true
            }
            
            if (!isInit) {
                sock.ev.off("messages.upsert", sock.handler)
                sock.ev.off("connection.update", sock.connectionUpdate)
                sock.ev.off('creds.update', sock.credsUpdate)
            }

            sock.handler = sock.handler ? sock.handler : handlerModule.handler.bind(sock) // Asegurar handler
            sock.connectionUpdate = connectionUpdate.bind(sock)
            sock.credsUpdate = saveCreds.bind(sock, true)
            
            sock.ev.on("messages.upsert", sock.handler)
            sock.ev.on("connection.update", sock.connectionUpdate)
            sock.ev.on("creds.update", sock.credsUpdate)
            isInit = false
            return true
        }
        creloadHandler(false)
    })
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    hours = (hours < 10) ? '0' + hours : hours
    minutes = (minutes < 10) ? '0' + minutes : minutes
    seconds = (seconds < 10) ? '0' + seconds : seconds
    return minutes + ' m y ' + seconds + ' s '
}

async function joinChannels(conn) {
    if (!global.ch) return // Prevención de error si no hay canales definidos
    for (const channelId of Object.values(global.ch)) {
        await conn.newsletterFollow(channelId).catch(() => { })
    }
}