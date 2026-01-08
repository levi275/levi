import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { tmpdir } from 'os'

function gifToMp4(gifBuffer){
return new Promise((resolve,reject)=>{
const tempGif=path.join(tmpdir(),`${Date.now()}.gif`)
const tempMp4=path.join(tmpdir(),`${Date.now()}.mp4`)
fs.writeFileSync(tempGif,gifBuffer)
const ffmpeg=spawn('ffmpeg',['-y','-i',tempGif,'-c:v','libx264','-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-movflags','+faststart',tempMp4])
ffmpeg.on('close',code=>{
fs.unlinkSync(tempGif)
if(code===0){
const mp4Buffer=fs.readFileSync(tempMp4)
fs.unlinkSync(tempMp4)
resolve(mp4Buffer)
}else reject(new Error(`ffmpeg error ${code}`))
})
ffmpeg.on('error',err=>{
fs.unlinkSync(tempGif)
reject(err)
})
})
}

let handler=async(m,{conn})=>{
await m.react('🌕')

const messages=[
"¡Buenas noches! 🌜 Espero que tengas un descanso reparador y sueñes con cosas hermosas.",
"¡Buenas noches! 🌟 Que la tranquilidad de la noche te envuelva y te prepare para un nuevo día.",
"¡Buenas noches! 🌌 Recuerda que cada estrella en el cielo es un sueño esperando a hacerse realidad.",
"¡Buenas noches! 🌙 Deja atrás las preocupaciones de hoy y abraza la paz de la noche.",
"¡Buenas noches! 🌠 Espero que tus sueños sean tan brillantes como las estrellas que iluminan el cielo.",
"¡Buenas noches! 💤 Que encuentres serenidad en el silencio de la noche y te despiertes renovado."
]

const videos=[
'https://i.pinimg.com/originals/8f/ee/cb/8feecbd791f6d57d9c9eabf2131a7f43.gif',
'https://i.pinimg.com/originals/6f/2e/99/6f2e99eeb5fd538f04545315f786ea97.gif',
'https://files.catbox.moe/0im4vk.mp4',
'https://files.catbox.moe/9cm0x9.mp4',
'https://files.catbox.moe/7kxjhv.mp4',
'https://files.catbox.moe/id09sr.mp4',
'https://files.catbox.moe/3kyhf0.mp4',
'https://files.catbox.moe/4qokmi.mp4'
]

const caption=messages[Math.floor(Math.random()*messages.length)]
const randomGif=videos[Math.floor(Math.random()*videos.length)]

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://google.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,gifPlayback:true,caption:caption,mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('fail')
}
}catch{
await conn.sendMessage(m.chat,{video:{url:randomGif},gifPlayback:true,caption:caption},{quoted:m})
}
}

handler.help=['nights','noche','noches']
handler.tags=['grupo']
handler.command=['nights','noche','noches']
handler.group=true

export default handler
