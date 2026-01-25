import db from '../lib/database.js'
let handler=async(m,{conn,text})=>{
let who
if(m.isGroup){
who=m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:null
}else{
who=m.chat
}
if(!who) return m.reply('⚠️ Por favor, menciona al usuario o cita un mensaje.')
if(who.includes('@lid')) return m.reply('⚠️ Error de identificación (LID). Menciona al usuario con @.')
let user=global.db.data.users[who]
if(!user) user=global.db.data.users[who]={coin:0}
let dmt
let lower=text.toLowerCase()
if(lower.includes('all')||lower.includes('todo')){
dmt=user.coin
}else{
let num=text.replace(/[^0-9.,]/g,'')
if(!num) return m.reply('⚠️ Ingresa una cantidad válida.')
num=num.replace(/\./g,'').replace(/,/g,'')
dmt=parseInt(num)
if(isNaN(dmt)||dmt<1) return m.reply('⚠️ La cantidad mínima es 1.')
}
if((user.coin||0)<dmt) return m.reply(`⚠️ El usuario no tiene suficientes Coins.\nTiene *¥${user.coin.toLocaleString()} ${m.moneda}*`)
user.coin-=dmt
await global.db.write()
conn.reply(m.chat,`💸 *COINS QUITADOS*\n\n» *Cantidad:* ¥${dmt.toLocaleString()} ${m.moneda}\n» *Usuario:* @${who.split('@')[0]}\n» *Restante:* ¥${user.coin.toLocaleString()} ${m.moneda}`,m,{mentions:[who]})
}
handler.help=['quitarcoin <@user> <cantidad|all>']
handler.tags=['owner']
handler.command=['quitarcoin','removecoin','removecoins']
handler.rowner=true
export default handler
