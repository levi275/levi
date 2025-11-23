import {promises as fs} from'fs'

const charactersFilePath='./src/database/characters.json'
const haremFilePath='./src/database/harem.json'

async function loadCharacters(){try{const data=await fs.readFile(charactersFilePath,'utf-8');return JSON.parse(data)}catch(error){throw new Error('❀ No se pudo cargar el archivo characters.json.')}}
async function loadHarem(){try{const data=await fs.readFile(haremFilePath,'utf-8');return JSON.parse(data)}catch(error){return[]}}

function similarity(a,b){
a=a.toLowerCase();b=b.toLowerCase()
const matrix=[]
for(let i=0;i<=b.length;i++){matrix[i]=[i]}
for(let j=0;j<=a.length;j++){matrix[0][j]=j}
for(let i=1;i<=b.length;i++){
for(let j=1;j<=a.length;j++){
matrix[i][j]=b.charAt(i-1)==a.charAt(j-1)
?matrix[i-1][j-1]
:Math.min(matrix[i-1][j-1]+1,matrix[i][j-1]+1,matrix[i-1][j]+1)
}}
const distance=matrix[b.length][a.length]
const maxLen=Math.max(a.length,b.length)
return 1-distance/maxLen
}

let handler=async(m,{conn,args})=>{
if(args.length===0){await conn.reply(m.chat,`《✧》Por favor, proporciona el nombre de un personaje.`,m);return}
const characterName=args.join(' ').toLowerCase().trim()
try{
const characters=await loadCharacters()
let character=characters.find(c=>c.name.toLowerCase()===characterName)
if(!character){
let best=null
let bestScore=0
for(const c of characters){
const score=similarity(characterName,c.name)
if(score>bestScore){bestScore=score;best=c}
}
if(bestScore>=0.45){character=best}
}
if(!character){await conn.reply(m.chat,`《✧》No se ha encontrado el personaje *${characterName}*. Asegúrate de que el nombre esté correcto.`,m);return}
const randomImage=character.img[Math.floor(Math.random()*character.img.length)]
const message=`❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`
await conn.sendFile(m.chat,randomImage,`${character.name}.jpg`,message,m)
}catch(error){await conn.reply(m.chat,`✘ Error al cargar la imagen del personaje: ${error.message}`,m)}
}

handler.help=['wimage <nombre del personaje>']
handler.tags=['anime']
handler.command=['charimage','wimage','waifuimage']
handler.group=true

export default handler
