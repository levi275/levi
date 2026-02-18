import * as baileysNS from '@whiskeysockets/baileys'

const requiredNamed = [
  'DisconnectReason',
  'useMultiFileAuthState',
  'makeCacheableSignalKeyStore',
  'fetchLatestBaileysVersion',
  'jidNormalizedUser',
  'delay',
  'areJidsSameUser',
  'WAMessageStubType',
  'getContentType',
  'generateForwardMessageContent',
  'generateWAMessageFromContent',
  'prepareWAMessageMedia',
  'generateWAMessageContent'
]

const defaultNeeded = [
  'proto',
  'makeWASocket',
  'generateWAMessageFromContent',
  'prepareWAMessageMedia',
  'generateWAMessageContent',
  'generateWAMessage',
  'decryptPollVote'
]

const missingNamed = requiredNamed.filter((k) => typeof baileysNS[k] === 'undefined')
const defaultExport = baileysNS.default || {}
const missingDefault = defaultNeeded.filter((k) => typeof defaultExport[k] === 'undefined')

if (missingNamed.length || missingDefault.length) {
  console.error('❌ Baileys smoke test FAILED')
  if (missingNamed.length) console.error('Missing named exports:', missingNamed.join(', '))
  if (missingDefault.length) console.error('Missing default exports:', missingDefault.join(', '))
  process.exit(1)
}

console.log('✅ Baileys smoke test OK')
console.log('Version-like keys available:', Object.keys(baileysNS).slice(0, 12).join(', '))
