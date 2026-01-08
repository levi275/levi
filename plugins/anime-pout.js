import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { tmpdir } from 'os'

function gifToMp4(buffer){
return new Promise((resolve,reject)=>{
const gif=path.join(tmpdir(),`${Date.now()}.gif`)
const mp4=path.join(tmpdir(),`${Date.now()}.mp4`)
fs.writeFileSync(gif,buffer)
const ffmpeg=spawn('ffmpeg',['-y','-i',gif,'-c:v','libx264','-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-movflags','+faststart',mp4])
ffmpeg.on('close',code=>{
fs.unlinkSync(gif)
if(code===0){
const out=fs.readFileSync(mp4)
fs.unlinkSync(mp4)
resolve(out)
}else reject('ffmpeg error')
})
ffmpeg.on('error',e=>{
fs.unlinkSync(gif)
reject(e)
})
})
}

let handler=async(m,{conn})=>{
let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameTarget=conn.getName(who)
let nameSender=conn.getName(m.sender)

let caption
if(who===m.sender){
caption=`\`${nameSender}\` *está haciendo pucheros.*`
}else{
caption=`\`${nameSender}\` *le está haciendo pucheros a* \`${nameTarget}\`.`
}

await m.react('🥺')

const poutGifs=[
'https://i.pinimg.com/originals/b2/5c/32/b25c3211c622490eef77f8878f2c8fc8.gif',
'https://telegra.ph/file/5239f6f8837383fa5bf2d.mp4',
'https://telegra.ph/file/63564769ec715d3b6379d.mp4',
'https://telegra.ph/file/06f7458e3a6a19deb5173.mp4',
'https://telegra.ph/file/cdd5e7db98e1d3a46231a.mp4',
'https://telegra.ph/file/070e2c38c9569a764cc10.mp4',
'https://telegra.ph/file/c1834a34cd0edfd2bdbe1.mp4',
'https://telegra.ph/file/4ceafdd813e727548cb2f.mp4',
'https://telegra.ph/file/7aa2790c3eba5b27416ce.mp4',
'https://telegra.ph/file/ec2d25e70b165a19e7ef7.mp4'
]

const randomGif=poutGifs[Math.floor(Math.random()*poutGifs.length)]

try{
const res=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://google.com/'}})
let buffer=Buffer.from(res.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('convert fail')
}
}catch{
await conn.sendMessage(m.chat,{video:{url:randomGif},caption:caption,gifPlayback:true,mentions:[who,m.sender]},{quoted:m})
}
}

handler.help=['pout','pucheros']
handler.tags=['anime']
handler.command=['pout','pucheros']
handler.group=true

export default handler
