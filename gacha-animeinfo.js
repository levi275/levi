import { promises as fs } from 'fs'
const charactersFilePath = './src/database/characters.json'
function similarity(s1,s2){
let longer=s1.toLowerCase().trim()
let shorter=s2.toLowerCase().trim()
if(longer.length<shorter.length){[longer,shorter]=[shorter,longer]}
let longerLength=longer.length
if(longerLength===0)return 1.0
return(longerLength-editDistance(longer,shorter))/parseFloat(longerLength)
}
function editDistance(s1,s2){
let costs=[]
for(let i=0;i<=s1.length;i++){
let lastValue=i
for(let j=0;j<=s2.length;j++){
if(i==0)costs[j]=j
else if(j>0){
let newValue=costs[j-1]
if(s1.charAt(i-1)!=s2.charAt(j-1))newValue=Math.min(Math.min(newValue,lastValue),costs[j])+1
costs[j-1]=lastValue
lastValue=newValue
}
}
if(i>0)costs[s2.length]=lastValue
}
return costs[s2.length]
}
async function loadCharacters(){
try{
const data=await fs.readFile(charactersFilePath,'utf-8')
return JSON.parse(data)
}catch(error){
throw new Error('❀ No se pudo cargar la base de datos.')
}
}
let handler=async(m,{conn,args})=>{
let query=args.join(' ').replace(/\d+$/,'').trim()
if(!query)return conn.reply(m.chat,'❀ Ingresa el nombre de una serie. Ejemplo: `#ainfo blue lock`',m)
try{
const allCharacters=await loadCharacters()
const sourceMap=new Map()
allCharacters.forEach(c=>{
const normalized=c.source.toLowerCase().trim()
if(!sourceMap.has(normalized))sourceMap.set(normalized,c.source)
})
const allNormalizedSources=Array.from(sourceMap.keys())
let bestMatchNormalized=allNormalizedSources.find(s=>s===query.toLowerCase())
if(!bestMatchNormalized){
let matches=allNormalizedSources.map(s=>({source:s,score:similarity(query,s)}))
matches.sort((a,b)=>b.score-a.score)
if(matches[0].score>0.4)bestMatchNormalized=matches[0].source
}
if(!bestMatchNormalized)return conn.reply(m.chat,`✘ No encontré nada parecido a "${query}".`,m)
const animeChars=allCharacters.filter(c=>c.source.toLowerCase().trim()===bestMatchNormalized)
const totalChars=animeChars.length
const claimedChars=animeChars.filter(c=>c.user)
const claimedCount=claimedChars.length
const percentage=((claimedCount/totalChars)*100).toFixed(0)
let pageArg=args.find(arg=>/^\d+$/.test(arg))
const page=parseInt(pageArg)||1
const perPage=25
const totalPages=Math.ceil(totalChars/perPage)
const startIndex=(page-1)*perPage
const endIndex=Math.min(startIndex+perPage,totalChars)
if(page<1||page>totalPages)return conn.reply(m.chat,`❀ Página no válida. Total: *${totalPages}*`,m)
const displayTitle=animeChars[0].source
let message=`*❀ Nombre: \`<${displayTitle}>\`*\n\n`
message+=`❏ Personajes » *\`${totalChars}\`*\n`
message+=`♡ Reclamados » *\`${claimedCount}/${totalChars} (${percentage}%)\`*\n`
message+=`❏ Lista de personajes:\n\n`
const listSlice=animeChars.sort((a,b)=>parseInt(b.value)-parseInt(a.value)).slice(startIndex,endIndex)
for(const char of listSlice){
let status='Libre.'
if(char.user){
try{
let name=await conn.getName(char.user)
status=`Reclamado por ${name}`
}catch{
status=`Reclamado por @${char.user.split('@')[0]}`
}
}
message+=`» *${char.name}* (${char.value}) • ${status}\n`
}
message+=`\n> ⌦ _Pagina *${page}* de *${totalPages}*_`
await conn.reply(m.chat,message,m,{mentions:claimedChars.map(c=>c.user)})
}catch(error){
console.error(error)
await conn.reply(m.chat,`✘ Error: ${error.message}`,m)
}
}
handler.help=['ainfo <serie>']
handler.tags=['gacha']
handler.command = ['animeinfo', 'serieinfo', 'ainfo']
handler.group=true
export default handler
