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
}else reject(new Error(`FFmpeg error ${code}`))
})
ffmpeg.on('error',err=>{
fs.unlinkSync(tempGif)
reject(err)
})
})
}

let handler=async(m,{conn})=>{
const sleepGifs=[
'https://i.pinimg.com/originals/e4/17/e7/e417e7504c33fdafb7736ce4b54b05d9.gif',
'https://i.pinimg.com/originals/ba/62/95/ba6295233b4bafd88512569b03697acd.gif',
'https://i.pinimg.com/originals/a7/e8/e8/a7e8e8f9fd0a8784012d8f14b09da4a8.gif',
'https://i.pinimg.com/originals/88/fa/62/88fa62689b47a6c4324b486f0c2fb997.gif',
'https://i.pinimg.com/originals/85/3e/f8/853ef80465a07f0258e86336a5e82425.gif',
'https://telegra.ph/file/b93da0c01981f17c05858.mp4',
'https://telegra.ph/file/8e0b0fe1d653d6956608a.mp4',
'https://telegra.ph/file/3b091f28e5f52bc774449.mp4',
'https://telegra.ph/file/7c795529b38d1a93395f6.mp4',
'https://telegra.ph/file/6b8e6cc26de052d4018ba.mp4'
]

let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender?`\`${nameSender}\` *está tomando una siesta.*`:`\`${nameSender}\` *está durmiendo con* \`${nameTarget}\`.`

await m.react('😴')

const randomGif=sleepGifs[Math.floor(Math.random()*sleepGifs.length)]

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://tenor.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('fail')
}
}catch{
await conn.sendMessage(m.chat,{image:{url:randomGif},caption:caption,mentions:[who,m.sender],mimetype:'image/gif'},{quoted:m})
}
}

handler.help=['sleep','dormir']
handler.tags=['anime']
handler.command=['sleep','dormir']
handler.group=true

export default handler
