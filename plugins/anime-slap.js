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
? `\`${nameSender}\` *se golpeó a sí mismo.*`
: `\`${nameSender}\` *golpeó a* \`${nameTarget}\`.`

await m.react('👊')

const slapGifs=[
'https://i.pinimg.com/originals/2b/3a/3e/2b3a3e107ac57d4f170a8f8e414fec9f.gif',
'https://i.pinimg.com/originals/e8/f8/80/e8f880b13c17d61810ac381b2f6a93c3.gif',
'https://i.pinimg.com/originals/8f/52/09/8f52096d6a1a333ece0fcc501eec106c.gif',
'https://telegra.ph/file/20ac5be925e6cd48f549f.mp4',
'https://telegra.ph/file/a00bc137b0beeec056b04.mp4',
'https://telegra.ph/file/080f08d0faa15119621fe.mp4',
'https://telegra.ph/file/eb0b010b2f249dd189d06.mp4',
'https://telegra.ph/file/734cb1e4416d80a299dac.mp4',
'https://telegra.ph/file/fc494a26b4e46c9b147d2.mp4'
]

const randomGif=slapGifs[Math.floor(Math.random()*slapGifs.length)]

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

handler.help=['slap','bofetada']
handler.tags=['anime']
handler.command=['slap','bofetada']
handler.group=true

export default handler
