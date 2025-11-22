import fetch from 'node-fetch';
const handler=async(m,{conn,text,args,usedPrefix,command})=>{
if(!text)throw`_*< DESCARGAS - TIKTOK />*_\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ Vɪᴅᴇᴏ Dᴇ TɪᴋTᴏᴋ.*\n\n*💌 Eᴊᴇᴍᴘʟᴏ:* _${usedPrefix+command} https://vm.tiktok.com/ZM6UHJYtE/_`;
if(!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text))throw`*< DESCARGAS - TIKTOK />*\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ Vɪᴅᴇᴏ Dᴇ Tɪᴋᴛᴏᴋ.*\n\n*💌 Eᴊᴇᴍᴘʟᴏ:* _${usedPrefix+command} https://vm.tiktok.com/ZM6UHJYtE/_`;
m.react('🕒');
const txt=`_💌 @${m.sender.split\`@\`[0]}  ᩭ✎Enviando Video, espere un momento...._`;
await conn.sendMessage(m.chat,{text:txt,contextInfo:{externalAdReply:{title:packname,body:wm,thumbnail:icons,sourceUrl:yt},mentionedJid:[m.sender]}},{quoted:m});
try{
const api=`https://www.tikwm.com/api/?url=${text}&hd=1`;
const res=await fetch(api);
const json=await res.json();
const r=json.data;
const caption=`✦・﹤ 𝑻𝑰𝑲𝑻𝑶𝑲 — 𝑫𝑬𝑺𝑪𝑨𝑹𝑮𝑨 ﹥・✦

「${r.title||'✧ 𝑺𝒊𝒏 𝒕𝒊𝒕𝒖𝒍𝒐 ✧'}」

❀ 𝑨𝒖𝒕𝒐𝒓: ${r.author?.nickname||'Desconocido'}
❀ 𝑫𝒖𝒓𝒂𝒄𝒊𝒐𝒏: ${r.duration||0}s
❀ 𝑽𝒊𝒔𝒕𝒂𝒔: ${r.play_count||0}
❀ 𝑳𝒊𝒌𝒆𝒔: ${r.digg_count||0}
❀ 𝑪𝒐𝒎𝒆𝒏𝒕𝒂𝒓𝒊𝒐𝒔: ${r.comment_count||0}
❀ 𝑪𝒐𝒎𝒑𝒂𝒓𝒕𝒊𝒅𝒐𝒔: ${r.share_count||0}
❀ 𝑭𝒆𝒄𝒉𝒂: ${formatDate(r.create_time)}

╰★━━━━━━━━━━━━━━━━━━★╯`;
await conn.sendFile(m.chat,r.play,'tiktok.mp4',caption,m);
m.react("🌸");
}catch(e){
throw`_*< DESCARGAS - TIKTOK />*_\n\n*🌟 Ocurrió un error. Inténtalo más tarde.*`;
}};
handler.help=['tiktok'];
handler.tags=['descargas'];
handler.command=/^(tiktok|tt|tiktokdl|ttdl)$/i;
handler.register=true;
export default handler;

function formatDate(ts){
const d=new Date(ts*1000);
return d.toLocaleString('es-ES',{timeZone:'America/Mexico_City'});
}
