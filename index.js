process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './settings.js'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts'
import {createRequire} from 'module'
import {fileURLToPath, pathToFileURL} from 'url'
import {platform} from 'process'
import * as ws from 'ws'
import fs, {readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch} from 'fs'
import yargs from 'yargs';
import {spawn} from 'child_process'
import lodash from 'lodash'
import { RubyJadiBot } from './plugins/jadibot-serbot.js';
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import {tmpdir} from 'os'
import {format} from 'util'
import boxen from 'boxen'
import P from 'pino'
import pino from 'pino'
import Pino from 'pino'
import path, { join, dirname } from 'path'
import {Boom} from '@hapi/boom'
import {makeWASocket, protoType, serialize} from './lib/simple.js'
import {Low, JSONFile} from 'lowdb'
import {mongoDB, mongoDBV2} from './lib/mongoDB.js'
import store from './lib/store.js'
const {proto} = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const {DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser} = await import('@whiskeysockets/baileys')
import readline, { createInterface } from 'readline'
import NodeCache from 'node-cache'
const {CONNECTING} = ws
const {chain} = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

//const yuw = dirname(fileURLToPath(import.meta.url))
//let require = createRequire(megu)
let { say } = cfonts


process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'


console.log(chalk.red(`
       .     .       .  .   . .   .   . .    +  .
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡤⠶⠚⠉⢉⣩⠽⠟⠛⠛⠛⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠉⠀⢀⣠⠞⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡞⠁⠀⠀⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠀⠀⠀⡼⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣠⡤⠤⠄⢤⣄⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⢰⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠴⠒⠋⠉⠀⠀⠀⣀⣤⠴⠒⠋⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⡄⠀⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⢳⡄⢀⡴⠚⠉⠀⠀⠀⠀⠀⣠⠴⠚⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢦⡀⠘⣧⠀⠀⠀⠀⠀⠀⠀⠀⣰⠃⠀⠀⠹⡏⠀⠀⠀⠀⠀⣀⣴⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠳⢬⣳⣄⣠⠤⠤⠶⠶⠒⠋⠀⠀⠀⠀⠹⡀⠀⠀⠀⠀⠈⠉⠛⠲⢦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠤⠖⠋⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢳⠦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣠⠖⠋⠀⠀⠀⣠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢱⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠀⢃⠈⠙⠲⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢠⠞⠁⠀⠀⠀⢀⢾⠃⠀⠀⠀⠀⠀⠀⠀⠀⢢⠀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⠀⠀⠀⠀⠀⣹⠮⣄⠀⠀⠀⠙⢦⡀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣰⠋⠀⠀⢀⡤⡴⠃⠈⠦⣀⠀⠀⠀⠀⠀⠀⢀⣷⢸⠀⠀⠀⠀⢀⣀⠘⡄⠤⠤⢤⠔⠒⠂⠉⠁⠀⠀⠀⠑⢄⡀⠀⠀⠙⢦⡀⠀⠀⠀
⠀⠀⠀⠀⣼⠃⠀⠀⢠⣞⠟⠀⠀⠀⡄⠀⠉⠒⠢⣤⣤⠄⣼⢻⠸⠀⠀⠀⠀⠉⢤⠀⢿⡖⠒⠊⢦⠤⠤⣀⣀⡀⠀⠀⠀⠈⠻⡝⠲⢤⣀⠙⢦⠀⠀
⠀⠀⠀⢰⠃⠀⠀⣴⣿⠎⠀⠀⢀⣜⠤⠄⢲⠎⠉⠀⠀⡼⠸⠘⡄⡇⠀⠀⠀⠀⢸⠀⢸⠘⢆⠀⠘⡄⠀⠀⠀⢢⠉⠉⠀⠒⠒⠽⡄⠀⠈⠙⠮⣷⡀
⠀⠀⠀⡟⠀⠀⣼⢻⠧⠐⠂⠉⡜⠀⠀⡰⡟⠀⠀⠀⡰⠁⡇⠀⡇⡇⠀⠀⠀⠀⢺⠇⠀⣆⡨⢆⠀⢽⠀⠀⠀⠈⡷⡄⠀⠀⠀⠀⠹⡄⠀⠀⠀⠈⠁
⠀⠀⢸⠃⠀⠀⢃⠎⠀⠀⠀⣴⠃⠀⡜⠹⠁⠀⠀⡰⠁⢠⠁⠀⢸⢸⠀⠀⠀⢠⡸⢣⠔⡏⠀⠈⢆⠀⣇⠀⠀⠀⢸⠘⢆⠀⠀⠀⠀⢳⠀⠀⠀⠀⠀
⠀⠀⢸⠀⠀⠀⡜⠀⠀⢀⡜⡞⠀⡜⠈⠏⠀⠈⡹⠑⠒⠼⡀⠀⠀⢿⠀⠀⠀⢀⡇⠀⢇⢁⠀⠀⠈⢆⢰⠀⠀⠀⠈⡄⠈⢢⠀⠀⠀⠈⣇⠀⠀⠀⠀
⠀⠀⢸⡀⠀⢰⠁⠀⢀⢮⠀⠇⡜⠀⠘⠀⠀⢰⠃⠀⠀⡇⠈⠁⠀⢘⡄⠀⠀⢸⠀⠀⣘⣼⠤⠤⠤⣈⡞⡀⠀⠀⠀⡇⠰⡄⢣⡀⠀⠀⢻⠀⠀⠀⠀
⠀⠀⠈⡇⠀⡜⠀⢀⠎⢸⢸⢰⠁⠀⠄⠀⢠⠃⠀⠀⢸⠀⠀⠀⠀⠀⡇⠀⠀⡆⠀⠀⣶⣿⡿⠿⡛⢻⡟⡇⠀⠀⠀⡇⠀⣿⣆⢡⠀⠀⢸⡇⠀⠀⠀
⠀⠀⢠⡏⠀⠉⢢⡎⠀⡇⣿⠊⠀⠀⠀⢠⡏⠀⠀⠀⠎⠀⠀⠀⠀⠀⡇⠀⡸⠀⠀⠀⡇⠀⢰⡆⡇⢸⢠⢹⠀⠀⠀⡇⠀⢹⠈⢧⣣⠀⠘⡇⠀⠀⠀
⠀⠀⢸⡇⠀⠀⠀⡇⠀⡇⢹⠀⠀⠀⢀⡾⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⢠⠃⠀⠀⠠⠟⡯⣻⣇⢃⠇⢠⠏⡇⠀⢸⡆⠀⢸⠀⠈⢳⡀⠀⡇⠀⠀⠀
⠀⠀⠀⣇⠀⡔⠋⡇⠀⢱⢼⠀⠀⡂⣼⡇⢹⣶⣶⣶⣤⣤⣀⠀⠀⠀⣇⠇⠀⠀⠀⠀⣶⡭⢃⣏⡘⠀⡎⠀⠇⠀⡾⣷⠀⣼⠀⠀⠀⢻⡄⡇⠀⠀⠀
⠀⠀⠀⣹⠜⠋⠉⠓⢄⡏⢸⠀⠀⢳⡏⢸⠹⢀⣉⢭⣻⡽⠿⠛⠓⠀⠋⠀⠀⠀⠀⠀⠘⠛⠛⠓⠀⡄⡇⠀⢸⢰⡇⢸⡄⡟⠀⠀⠀⠀⢳⡇⠀⠀⠀
⠀⣠⠞⠁⠀⠀⠀⠀⠀⢙⠌⡇⠀⣿⠁⠀⡇⡗⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⠀⠀⠀⠀⠀⠀⠁⠁⠀⢸⣼⠀⠈⣇⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⠁⠀⠀⢀⡠⠔⠚⠉⠉⢱⣇⢸⢧⠀⠀⠸⣱⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⡤⠦⡔⠀⠀⠀⠀⠀⢀⡼⠀⠀⣼⡏⠀⠀⢹⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⠀⠀⠀⠋⠀⠀⠀⢀⡠⠤⣿⣾⣇⣧⠀⠀⢫⡆⠀⠀⠀⠀⠀⠀⠀⢨⠀⠀⣠⠇⠀⠀⢀⡠⣶⠋⠀⠀⡸⣾⠁⠀⠀⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⡄⠀⠀⠀⠀⠠⠊⠁⠀⠀⢸⢃⠘⡜⡵⡀⠈⢿⡱⢲⡤⠤⢀⣀⣀⡀⠉⠉⣀⡠⡴⠚⠉⣸⢸⠀⠀⢠⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢧⠀⠀⠀⠀⠀⠀⠀⣀⠤⠚⠚⣤⣵⡰⡑⡄⠀⢣⡈⠳⡀⠀⠀⠀⢨⡋⠙⣆⢸⠀⠀⣰⢻⡎⠀⠀⡎⡇⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠈⢷⡀⠀⠀⠀⠀⠀⠁⠀⠀⠀⡸⢌⣳⣵⡈⢦⡀⠳⡀⠈⢦⡀⠀⠘⠏⠲⣌⠙⢒⠴⡧⣸⡇⠀⡸⢸⠇⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢠⣿⠢⡀⠀⠀⠀⠠⠄⡖⠋⠀⠀⠙⢿⣳⡀⠑⢄⠹⣄⡀⠙⢄⡠⠤⠒⠚⡖⡇⠀⠘⣽⡇⢠⠃⢸⢀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣾⠃⠀⠀⠀⠀⠀⢀⡼⣄⠀⠀⠀⠀⠀⠑⣽⣆⠀⠑⢝⡍⠒⠬⢧⣀⡠⠊⠀⠸⡀⠀⢹⡇⡎⠀⡿⢸⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⡼⠁⠀⠀⠀⠀⠀⠀⢀⠻⣺⣧⠀⠀⠀⠰⢢⠈⢪⡷⡀⠀⠙⡄⠀⠀⠱⡄⠀⠀⠀⢧⠀⢸⡻⠀⢠⡇⣾⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢰⠇⠀⠀⠀⠀⠀⠀⠀⢸⠀⡏⣿⠀⠀⠀⠀⢣⢇⠀⠑⣄⠀⠀⠸⡄⠀⠀⠘⡄⠀⠀⠸⡀⢸⠁⠀⡾⢰⡏⢳⡀
`))

cfonts.say('Ruby Hoshino Bot', {
  font: 'chrome',
  align: 'center',
  gradient: ['#ff4fcb', '#ff77ff'],
  transition: true,
  env: 'node'
})

// Créditos
cfonts.say('Developed By: Dioneibi-rip', {
  font: 'console',
  align: 'center',
  colors: ['blueBright']
})

console.log(chalk.magentaBright('~`⊹₊ ︵︵︵﹒🌟﹒︵︵︵ ₊˚⊹`~'))
console.log(chalk.whiteBright('        🚀 𝕭𝖎𝖊𝖓𝖛𝖊𝖓𝖎𝖉𝖔 𝖆𝖑 𝖓𝖚́𝖈𝖑𝖊𝖔 𝖉𝖊 𝕽𝖚𝖇𝖞 𝕳𝖔𝖘𝖍𝖎𝖓𝖔 𝕭𝖔𝖙 🚀'))
console.log(chalk.whiteBright('      ✨ ¡𝕻𝖗𝖊𝖕𝖆𝖗𝖆𝖓𝖉𝖔 𝖙𝖚 𝖘𝖊𝖘𝖎𝖔́𝖓! 𝕽𝖚𝖇𝖞 𝖙𝖊 𝖊𝖘𝖕𝖊𝖗𝖆... ✨'))
console.log(chalk.magentaBright('~`⊹₊ ︵︵︵﹒🌟﹒︵︵︵ ₊˚⊹`~\n'))

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; global.__dirname = function dirname(pathURL) {
return path.dirname(global.__filename(pathURL, true))
}; global.__require = function require(dir = import.meta.url) {
return createRequire(dir)
}

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '');

global.timestamp = {start: new Date}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#/!.]')
// global.opts['db'] = process.env['db']

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('./src/database/database.json'))

global.DATABASE = global.db 
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) {
return new Promise((resolve) => setInterval(async function() {
if (!global.db.READ) {
clearInterval(this)
resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
}}, 1 * 1000))
}
if (global.db.data !== null) return
global.db.READ = true
await global.db.read().catch(console.error)
global.db.READ = null
global.db.data = {
users: {},
chats: {},
stats: {},
msgs: {},
sticker: {},
settings: {},
...(global.db.data || {}),
}
global.db.chain = chain(global.db.data)
}
loadDatabase()

const {state, saveState, saveCreds} = await useMultiFileAuthState(global.Rubysessions)
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = new NodeCache()
const {version} = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumber

const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
const colores = chalk.bgMagenta.white
const opcionQR = chalk.bold.green
const opcionTexto = chalk.bold.cyan
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

// --- DECORACIÓN PARA PREGUNTAS ---
const marcoSuperior = chalk.bold.magentaBright('▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰');
const marcoInferior = chalk.bold.magentaBright('▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰');
const lineaVacia = chalk.bold.magentaBright('║');
// --- FIN DE DECORACIÓN ---

let opcion
if (methodCodeQR) {
opcion = '1'
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${Rubysessions}/creds.json`)) {
do {
opcion = await question(
  marcoSuperior + '\n' +
  lineaVacia + chalk.bold.white('      🔮 ¿𝘾𝙤𝙢𝙤 𝙙𝙚𝙨𝙚𝙖𝙨 𝙘𝙤𝙣𝙚𝙘𝙩𝙖𝙧𝙩𝙚? 🔮     ') + lineaVacia + '\n' +
  lineaVacia + '                                       ' + lineaVacia + '\n' +
  lineaVacia + '   ' + opcionQR('1. 𝘾𝙤𝙣 𝙘𝙤𝙙𝙞𝙜𝙤 𝙌𝙍') + '                   ' + lineaVacia + '\n' +
  lineaVacia + '   ' + opcionTexto('2. 𝘾𝙤𝙣 𝙘𝙤́𝙙𝙞𝙜𝙤 𝙙𝙚 8 𝘿𝙞𝙜𝙞𝙩𝙤𝙨') + '     ' + lineaVacia + '\n' +
  lineaVacia + '                                       ' + lineaVacia + '\n' +
  marcoInferior + '\n' +
  chalk.bold.whiteBright('⇢ 𝖤𝗅𝗂𝗀𝖾 𝗎𝗇𝖺 𝗈𝗉𝖼𝗂𝗈́𝗇 (1/2): ')
);

if (!/^[1-2]$/.test(opcion)) {
console.log(chalk.bold.redBright(`\n         ® ╥﹏╥ solo se permiten los números 1 o 2 ®\n`))
}} while (opcion !== '1' && opcion !== '2' || fs.existsSync(`./${Rubysessions}/creds.json`))
} 

console.info = () => {} 
console.debug = () => {} 

const connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile, 
browser: opcion == '1' ? [`${nameqr}`, 'Edge', '20.0.04'] : methodCodeQR ? [`${nameqr}`, 'Edge', '20.0.04'] : ['Ubuntu', 'Edge', '110.0.1587.56'],
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
},
markOnlineOnConnect: true, 
generateHighQualityLinkPreview: true, 
getMessage: async (clave) => {
let jid = jidNormalizedUser(clave.remoteJid)
let msg = await store.loadMessage(jid, clave.id)
return msg?.message || ""
},
msgRetryCounterCache,
msgRetryCounterMap,
defaultQueryTimeoutMs: undefined,
version,
}

global.conn = makeWASocket(connectionOptions);

if (!fs.existsSync(`./${Rubysessions}/creds.json`)) {
if (opcion === '2' || methodCode) {
opcion = '2'
if (!conn.authState.creds.registered) {
let addNumber
if (!!phoneNumber) {
addNumber = phoneNumber.replace(/[^0-9]/g, '')
} else {
do {
phoneNumber = await question(
  marcoSuperior + '\n' +
  lineaVacia + chalk.bold.greenBright('    📱 іᥒgrᥱsᥲ 𝗍ᥙ ᥒᥙ́mᥱr᥆ 📱 ') + lineaVacia + '\n' +
  lineaVacia + '                                       ' + lineaVacia + '\n' +
  lineaVacia + chalk.bold.yellowBright('   ✏  ᥱȷᥱm⍴ᥣ᥆: +57321xxxxxxx') + '             ' + lineaVacia + '\n' +
  marcoInferior + '\n' +
  chalk.bold.whiteBright('⇢ ᥒᥙmᥱr᥆: ')
);
phoneNumber = phoneNumber.replace(/\D/g,'')
if (!phoneNumber.startsWith('+')) {
phoneNumber = `+${phoneNumber}`
}
} while (!await isValidPhoneNumber(phoneNumber))
rl.close()
addNumber = phoneNumber.replace(/\D/g, '')
setTimeout(async () => {
let codeBot = await conn.requestPairingCode(addNumber)
codeBot = codeBot?.match(/.{1,4}/g)?.join(" — ") || codeBot
console.log(chalk.bold.magentaBright('\n~`⊹₊ ︵︵︵﹒🔗﹒︵︵︵ ₊˚⊹`~'));
console.log(chalk.bold.white(chalk.bgMagenta(` ✧ código de vinculación ✧ `)));
console.log(chalk.bold.white(`\n¡No compartas este código con nadie!`));
console.log(chalk.bold.whiteBright.bgBlack(`   ${codeBot}   `));
console.log(chalk.bold.magentaBright('~`⊹₊ ︵︵︵﹒🔗﹒︵︵︵ ₊˚⊹`~\n'));
}, 3000)
}}}
}

conn.isInit = false;
conn.well = false;
//conn.logger.info(`✦  H E C H O\n`)

if (!opts['test']) {
if (global.db) setInterval(async () => {
if (global.db.data) await global.db.write()
if (opts['autocleartmp'] && (global.support || {}).find) (tmp = [os.tmpdir(), 'tmp', `${jadi}`], tmp.forEach((filename) => cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])));
}, 30 * 1000);
}

// if (opts['server']) (await import('./server.js')).default(global.conn, PORT);

async function connectionUpdate(update) {
const {connection, lastDisconnect, isNewLogin} = update;
global.stopped = connection;
if (isNewLogin) conn.isInit = true;
const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
await global.reloadHandler(true).catch(console.error);
global.timestamp.connect = new Date;
}
if (global.db.data == null) loadDatabase();
if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
if (opcion == '1' || methodCodeQR) {
console.log(chalk.bold.yellow(`\n⇢  escanea el código qr, expira en 45 segundos...`))}
}
if (connection == 'open') {
console.log(chalk.bold.green('\n❀✨ 𝕽𝖚𝖇𝖞-𝕭𝖔𝖙 𝕮𝖔𝖓𝖊𝖈𝖙𝖆𝖉𝖆 𝖈𝖔𝖓 𝖊́𝖝𝖎𝖙𝖔 ✨❀\n'))
}
let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
if (connection === 'close') {
if (reason === DisconnectReason.badSession) {
console.log(chalk.bold.cyanBright(`\n[ ⚠︎ ] 𝕾𝕴𝕹 𝕮𝕺𝕹𝕰𝖃𝕴𝕺́𝕹, 𝖇𝖔𝖗𝖗𝖊 𝖑𝖆 𝖈𝖆𝖗𝖕𝖊𝖙𝖆 ${global.Rubysessions} 𝖞 𝖊𝖘𝖈𝖆𝖓𝖊𝖆 𝖊𝖑 𝖈𝖔́𝖉𝖎𝖌𝖔 𝕼𝕽.\n`))
} else if (reason === DisconnectReason.connectionClosed) {
console.log(chalk.bold.magentaBright(`\n╭┄┄┄ ☹ ┄┄┄ • • • ┄┄┄ ☹ ┄┄┄╮\n┆ ⚠︎ 𝕮𝕺𝕹𝕰𝖃𝕴𝕺́𝕹 𝕮𝕰𝕽𝕽𝕬𝕯𝕬, 𝕽𝕰𝕮𝕺𝕹𝕰𝕮𝕿𝕬𝕹𝕯𝕺....\n╰┄┄┄ ☹ ┄┄┄ • • • ┄┄┄ ☹ ┄┄┄╯\n`))
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.connectionLost) {
console.log(chalk.bold.blueBright(`\n╭┄┄┄ ☂ ┄┄┄ • • • ┄┄┄ ☂ ┄┄┄╮\n┆ ⚠︎ 𝕮𝕺𝕹𝕰𝖃𝕴𝕺́𝕹 𝕻𝕰𝕽𝕯𝕴𝕯𝕬, 𝕽𝕰𝕮𝕺𝕹𝕰𝕮𝕿𝕬𝕹𝕯𝕺....\n╰┄┄┄ ☂ ┄┄┄ • • • ┄┄┄ ☂ ┄┄┄╯\n`))
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.connectionReplaced) {
console.log(chalk.bold.yellowBright(`\n╭┄┄┄ ✗ ┄┄┄ • • • ┄┄┄ ✗ ┄┄┄╮\n┆ ⚠︎ 𝕮𝕺𝕹𝕰𝖃𝕴𝕺́𝕹 𝕽𝕰𝕰𝕸𝕻𝕷𝕬𝖅𝕬𝕯𝕬, 𝖈𝖎𝖊𝖗𝖗𝖊 𝖑𝖆 𝖘𝖊𝖘𝖎𝖔́𝖓 𝖆𝖈𝖙𝖚𝖆𝖑.\n╰┄┄┄ ✗ ┄┄┄ • • • ┄┄┄ ✗ ┄┄┄╯\n`))
} else if (reason === DisconnectReason.loggedOut) {
console.log(chalk.bold.redBright(`\n[ ⚠︎ ] 𝕾𝕴𝕹 𝕮𝕺𝕹𝕰𝖃𝕴𝕺́𝕹, 𝖇𝖔𝖗𝖗𝖊 𝖑𝖆 𝖈𝖆𝖕𝖊𝖙𝖆 ${global.Rubysessions} 𝖞 𝖊𝖘𝖈𝖆𝖓𝖊𝖆 𝖊𝖑 𝖈𝖔́𝖉𝖎𝖌𝖔 𝕼𝕽.\n`))
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.restartRequired) {
console.log(chalk.bold.cyanBright(`\n╭┄┄┄ ✓ ┄┄┄ • • • ┄┄┄ ✓ ┄┄┄╮\n┆ ✧ 𝕮𝕺𝕹𝕰𝕮𝕿𝕬𝕹𝕯𝕺 𝕬𝕷 𝕾𝕰𝕽𝖁𝕴𝕯𝕺𝕽...\n╰┄┄┄ ✓ ┄┄┄ • • • ┄┄┄ ✓ ┄┄┄╯\n`))
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.timedOut) {
console.log(chalk.bold.yellowBright(`\n╭┄┄┄ ⧖ ┄┄┄ • • • ┄┄┄ ⧖ ┄┄┄╮\n┆ ⧖ 𝕿𝕴𝕰𝕸𝕻𝕺 𝕬𝕲𝕺𝕿𝕬𝕯𝕺, 𝕽𝕰𝕮𝕺𝕹𝕰𝕮𝕿𝕬𝕹𝕯𝕺....\n╰┄┄┄ ⧖ ┄┄┄ • • • ┄┄┄ ⧖ ┄┄┄╯\n`))
await global.reloadHandler(true).catch(console.error) //process.send('reset')
} else {
console.log(chalk.bold.redBright(`\n[ ⚠︎！] 𝕽𝕬𝖅𝕺𝕹 𝕯𝕰𝕾𝕮𝕺𝕹𝕺𝕮𝕴𝕯𝕬: ${reason || 'No encontrado'} >> ${connection || 'No encontrado'}\n`))
}}
}
process.on('uncaughtException', console.error)

let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function(restatConn) {
try {
const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) {
console.error(e);
}
if (restatConn) {
const oldChats = global.conn.chats
try {
global.conn.ws.close()
} catch { }
conn.ev.removeAllListeners()
global.conn = makeWASocket(connectionOptions, {chats: oldChats})
isInit = true
}
if (!isInit) {
conn.ev.off('messages.upsert', conn.handler)
conn.ev.off('connection.update', conn.connectionUpdate)
conn.ev.off('creds.update', conn.credsUpdate)
}

conn.handler = handler.handler.bind(global.conn)
conn.connectionUpdate = connectionUpdate.bind(global.conn)
conn.credsUpdate = saveCreds.bind(global.conn, true)

const currentDateTime = new Date()
const messageDateTime = new Date(conn.ev)
if (currentDateTime >= messageDateTime) {
const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0])

} else {
const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0])
}

conn.ev.on('messages.upsert', conn.handler)
conn.ev.on('connection.update', conn.connectionUpdate)
conn.ev.on('creds.update', conn.credsUpdate)
isInit = false
return true
};

//Arranque nativo para subbots by - ReyEndymion >> https://github.com/ReyEndymion

global.rutaJadiBot = join(__dirname, './RubyJadiBots')

if (global.RubyJadibts) {
if (!existsSync(global.rutaJadiBot)) {
mkdirSync(global.rutaJadiBot, { recursive: true }) 
console.log(chalk.bold.cyan(`La carpeta: ${jadi} se creó correctamente.`))
} else {
console.log(chalk.bold.cyan(`La carpeta: ${jadi} ya está creada.`)) 
}

const readRutaJadiBot = readdirSync(rutaJadiBot)
if (readRutaJadiBot.length > 0) {
const creds = 'creds.json'
for (const gjbts of readRutaJadiBot) {
const botPath = join(rutaJadiBot, gjbts)
const readBotPath = readdirSync(botPath)
if (readBotPath.includes(creds)) {
RubyJadiBot({pathRubyJadiBot: botPath, m: null, conn, args: '', usedPrefix: '/', command: 'serbot'})
}
}
}
}

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
try {
const file = global.__filename(join(pluginFolder, filename))
const module = await import(file)
global.plugins[filename] = module.default || module
} catch (e) {
conn.logger.error(e)
delete global.plugins[filename]
}}}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);

global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true);
if (filename in global.plugins) {
if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`)
else {
conn.logger.warn(`deleted plugin - '${filename}'`)
return delete global.plugins[filename]
}} else conn.logger.info(`new plugin - '${filename}'`);
const err = syntaxerror(readFileSync(dir), filename, {
sourceType: 'module',
allowAwaitOutsideFunction: true,
});
if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
else {
try {
const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
global.plugins[filename] = module.default || module;
} catch (e) {
conn.logger.error(`error require plugin '${filename}\n${format(e)}'`)
} finally {
global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
}}
}}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()
async function _quickTest() {
const test = await Promise.all([
spawn('ffmpeg'),
spawn('ffprobe'),
spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
spawn('convert'),
spawn('magick'),
spawn('gm'),
spawn('find', ['--version']),
].map((p) => {
return Promise.race([
new Promise((resolve) => {
p.on('close', (code) => {
resolve(code !== 127);
});
}),
new Promise((resolve) => {
p.on('error', (_) => resolve(false));
})]);
}));
const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
const s = global.support = {ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find};
Object.freeze(global.support);
}

function clearTmp() {
const tmpDir = join(__dirname, 'tmp')
const filenames = readdirSync(tmpDir)
filenames.forEach(file => {
const filePath = join(tmpDir, file)
unlinkSync(filePath)})
}

function purgeRubySession() {
let prekey = []
let directorio = readdirSync(`./${Rubysessions}`)
let filesFolderPreKeys = directorio.filter(file => {
return file.startsWith('pre-key-')
})
prekey = [...prekey, ...filesFolderPreKeys]
filesFolderPreKeys.forEach(files => {
unlinkSync(`./${Rubysessions}/${files}`)
})
} 

function purgeRubySessionSB() {
try {
const listaDirectorios = readdirSync(`./${jadi}/`);
let SBprekey = [];
listaDirectorios.forEach(directorio => {
if (statSync(`./${jadi}/${directorio}`).isDirectory()) {
const DSBPreKeys = readdirSync(`./${jadi}/${directorio}`).filter(fileInDir => {
return fileInDir.startsWith('pre-key-')
})
SBprekey = [...SBprekey, ...DSBPreKeys];
DSBPreKeys.forEach(fileInDir => {
if (fileInDir !== 'creds.json') {
unlinkSync(`./${jadi}/${directorio}/${fileInDir}`)
}})
}})
if (SBprekey.length === 0) {
console.log(chalk.bold.green(`\n╭» ❍ ${jadi} ❍\n│→ 𝕹𝖆𝖉𝖆 𝖕𝖔𝖗 𝖊𝖑𝖎𝖒𝖎𝖓𝖆𝖗.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻︎`))
} else {
console.log(chalk.bold.cyanBright(`\n╭» ❍ ${jadi} ❍\n│→ 𝕬𝖗𝖈𝖍𝖎𝖛𝖔𝖘 𝖓𝖔 𝖊𝖘𝖊𝖓𝖈𝖎𝖆𝖑𝖊𝖘 𝖊𝖑𝖎𝖒𝖎𝖓𝖆𝖉𝖔𝖘.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻︎︎`))
}} catch (err) {
console.log(chalk.bold.red(`\n╭» ❍ ${jadi} ❍\n│→ 𝕺𝖈𝖚𝖗𝖗𝖎𝖔́ 𝖚𝖓 𝖊𝖗𝖗𝖔𝖗.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻\n` + err))
}}

function purgeOldFiles() {
const directories = [`./${Rubysessions}/`, `./${jadi}/`]
directories.forEach(dir => {
readdirSync(dir, (err, files) => {
if (err) throw err
files.forEach(file => {
if (file !== 'creds.json') {
const filePath = path.join(dir, file);
unlinkSync(filePath, err => {
if (err) {
console.log(chalk.bold.red(`\n╭» ❍ ARCHIVO ❍\n│→ ${file} 𝖓𝖔 𝖘𝖊 𝖑𝖔𝖌𝖗𝖔́ 𝖇𝖔𝖗𝖗𝖆𝖗.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ✘\n` + err))
} else {
console.log(chalk.bold.green(`\n╭» ❍ ARCHIVO ❍\n│→ ${file} 𝖇𝖔𝖗𝖗𝖆𝖉𝖔 𝖈𝖔𝖓 𝖊́𝖝𝖎𝖙𝖔.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`))
} }) }
}) }) }) }

function redefineConsoleMethod(methodName, filterStrings) {
const originalConsoleMethod = console[methodName]
console[methodName] = function() {
const message = arguments[0]
if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
arguments[0] = ""
}
originalConsoleMethod.apply(console, arguments)
}}

setInterval(async () => {
if (stopped === 'close' || !conn || !conn.user) return
await clearTmp()
console.log(chalk.bold.cyanBright(`\n╭» ❍ MULTIMEDIA ❍\n│→ 𝕬𝖗𝖈𝖍𝖎𝖛𝖔𝖘 𝖉𝖊 𝖑𝖆 𝖈𝖆𝖗𝖕𝖊𝖙𝖆 𝕿𝕸𝕻 𝖊𝖑𝖎𝖒𝖎𝖓𝖆𝖉𝖔𝖘.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`))}, 1000 * 60 * 4) // 4 min 

setInterval(async () => {
if (stopped === 'close' || !conn || !conn.user) return
await purgeRubySession()
console.log(chalk.bold.cyanBright(`\n╭» ❍ ${global.Rubysessions} ❍\n│→ 𝕾𝖊𝖘𝖎𝖔𝖓𝖊𝖘 𝖓𝖔 𝖊𝖘𝖊𝖓𝖈𝖎𝖆𝖑𝖊𝖘 𝖊𝖑𝖎𝖒𝖎𝖓𝖆𝖉𝖆𝖘.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`))}, 1000 * 60 * 10) // 10 min

setInterval(async () => {
if (stopped === 'close' || !conn || !conn.user) return
await purgeRubySessionSB()}, 1000 * 60 * 10)  

setInterval(async () => {
if (stopped === 'close' || !conn || !conn.user) return
console.log(await purgeOldFiles());
console.log(chalk.bold.cyanBright(`\n╭» ❍ ARCHIVOS ❍\n│→ 𝕬𝖗𝖈𝖍𝖎𝖛𝖔𝖘 𝖗𝖊𝖘𝖎𝖉𝖚𝖆𝖑𝖊𝖘 𝖊𝖑𝖎𝖒𝖎𝖓𝖆𝖉𝖔𝖘.\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`))}, 1000 * 60 * 10)

_quickTest().then(() => conn.logger.info(chalk.bold(`✦  H E C H O\n`.trim()))).catch(console.error)

async function isValidPhoneNumber(number) {
try {
number = number.replace(/\s+/g, '')
if (number.startsWith('+521')) {
number = number.replace('+521', '+52');
} else if (number.startsWith('+52') && number[4] === '1') {
number = number.replace('+52 1', '+52');
}
const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
return phoneUtil.isValidNumber(parsedNumber)
} catch (error) {
return false
}
}