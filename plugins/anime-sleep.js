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
'https://telegra.ph/file/0684477ff198a678d4821.mp4',
'https://telegra.ph/file/583b7a7322fd6722751b5.mp4',
'https://telegra.ph/file/e6ff46f4796c57f2235bd.mp4',
'https://telegra.ph/file/06b4469cd5974cf4e28ff.mp4',
'https://telegra.ph/file/9213f74b91f8a96c43922.mp4',
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
