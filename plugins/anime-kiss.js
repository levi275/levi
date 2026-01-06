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
}else reject(new Error(`FFmpeg falló con código ${code}`))
})
ffmpeg.on('error',err=>{
fs.unlinkSync(tempGif)
reject(err)
})
})
}

let handler=async(m,{conn})=>{
const kissGifs=[
'https://i.pinimg.com/originals/0c/2a/89/0c2a89004ebf7f6b6a4b0b5553dc8776.gif',
'https://i.pinimg.com/originals/10/5a/7a/105a7ad7edbe74e5ca834348025cc650.gif',
'https://i.pinimg.com/originals/8e/36/da/8e36dab30ae3e74a17c1fca0e7092e1a.gif',
'https://i.pinimg.com/originals/10/5a/7a/105a7ad7edbe74e5ca834348025cc650.gif',
'https://i.pinimg.com/originals/0c/2a/89/0c2a89004ebf7f6b6a4b0b5553dc8776.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif', 
]

let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender?`\`${nameSender}\` *se besó a sí mismo ( ˘ ³˘)♥*`:`\`${nameSender}\` *besó a* \`${nameTarget}\` 💋.`

const randomGif=kissGifs[Math.floor(Math.random()*kissGifs.length)]

await m.react('🫦')

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://tenor.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('Fallo conversión')
}
}catch{
await conn.sendMessage(m.chat,{image:{url:randomGif},caption:caption,mentions:[who,m.sender],mimetype:'image/gif'},{quoted:m})
}
}

handler.help=['kiss','besar']
handler.tags=['anime']
handler.command=['kiss','besar']
handler.group=true

export default handler
