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
let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender
? `\`${nameSender}\` *está asustad﹫.*`
: `\`${nameSender}\` *está asustad﹫ de* \`${nameTarget}\`.`

await m.react('😨')

const scaredGifs=[
'https://i.pinimg.com/originals/90/6d/61/906d61263992beb3000e6beab2d860aa.gif',
'https://telegra.ph/file/0c802b4fa616aaf1da229.mp4',
'https://telegra.ph/file/d0b166d9a363765e51657.mp4',
'https://telegra.ph/file/eae6dd9d45e45fe3a95ab.mp4',
'https://telegra.ph/file/1785e535a4463c2a337c5.mp4',
'https://telegra.ph/file/c1673b418bc61db1e51a0.mp4',
'https://telegra.ph/file/9774e1d74c3abf083ae01.mp4',
'https://telegra.ph/file/dcde646a58d8e9bf44867.mp4'
]

const randomGif=scaredGifs[Math.floor(Math.random()*scaredGifs.length)]

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://google.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('conversion fail')
}
}catch{
await conn.sendMessage(m.chat,{video:{url:randomGif},caption:caption,gifPlayback:true,mentions:[who,m.sender]},{quoted:m})
}
}

handler.help=['scared','asustada']
handler.tags=['anime']
handler.command=['scared','asustada']
handler.group=true

export default handler
