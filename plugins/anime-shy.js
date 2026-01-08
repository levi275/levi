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
? `\`${nameSender}\` *es muy timid﹫.*`
: `\`${nameSender}\` *está tímid﹫ por* \`${nameTarget}\`.`

await m.react('😛')

const shyGifs=[
'https://i.pinimg.com/originals/df/aa/d1/dfaad160939b71b8b361b98e389f7b13.gif',
'https://i.pinimg.com/originals/ad/ce/cb/adcecba1d189dc3ae2a11fa77a2c6c11.gif',
'https://i.pinimg.com/originals/63/5f/f7/635ff7de4d9228e140153bff49b6dd4d.gif',
'https://telegra.ph/file/4f9323ca22e126b9d275c.mp4',
'https://telegra.ph/file/51b688e0c5295bc37ca92.mp4',
'https://telegra.ph/file/dfe74d7eee02c170f6f55.mp4',
'https://telegra.ph/file/697719af0e6f3baec4b2f.mp4',
'https://telegra.ph/file/89e1e1e44010975268b38.mp4',
'https://telegra.ph/file/654313ad5a3e8b43fc535.mp4'
]

const randomGif=shyGifs[Math.floor(Math.random()*shyGifs.length)]

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

handler.help=['shy','timida']
handler.tags=['anime']
handler.command=['shy','timida']
handler.group=true

export default handler
