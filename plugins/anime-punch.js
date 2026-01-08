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
caption=`\`${nameSender}\` *se golpeó a sí mismo.*`
}else{
caption=`\`${nameSender}\` *golpeó a* \`${nameTarget}\`.`
}

await m.react('👊')

const punchGifs=[
'https://i.pinimg.com/originals/8d/50/60/8d50607e59db86b5afcc21304194ba57.gif',
'https://i.pinimg.com/originals/43/aa/c9/43aac9630b94800a6b18c20583275b61.gif',
'https://i.pinimg.com/originals/95/36/a2/9536a25196452bb16956b7ddbd303268.gif',
'https://i.pinimg.com/originals/5e/fb/cf/5efbcf0acc85455f826a9dc2b84e03be.gif',
'https://i.pinimg.com/originals/7c/17/7f/7c177fc5545cf5939bfa37ca1fb8797b.gif',
'https://telegra.ph/file/804eada656f96a04ebae8.mp4',
'https://telegra.ph/file/3a2ef7a12eecbb6d6df53.mp4',
'https://telegra.ph/file/c4c27701496fec28d6f8a.mp4',
'https://telegra.ph/file/c8e5a210a3a34e23391ee.mp4',
'https://telegra.ph/file/70bac5a760539efad5aad.mp4'
]

const randomGif=punchGifs[Math.floor(Math.random()*punchGifs.length)]

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

handler.help=['punch','pegar','golpear']
handler.tags=['anime']
handler.command=['punch','pegar','golpear']
handler.group=true

export default handler
