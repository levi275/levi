import fetch from 'node-fetch';
const handler=async(m,{conn,args,usedPrefix,command})=>{
if(!args[0])return conn.reply(m.chat,`_*< DESCARGAS - TIKTOK />*_\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ TɪᴋTᴏᴋ.*\n\n*💌 Ejemplo:* ${usedPrefix+command} https://vm.tiktok.com/ZM6UHJYtE/`,m);
const link=args[0];
const regex=/^(https?:\/\/)?(www\.)?(vm\.tiktok\.com|tiktok\.com)\/.+/i;
if(!regex.test(link))return conn.reply(m.chat,`_*< DESCARGAS - TIKTOK />*_\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Vᴀ́ʟɪᴅᴏ ᴅᴇ Tɪᴋᴛᴏᴋ.*\n\n*💌 Ejemplo:* ${usedPrefix+command} https://vm.tiktok.com/ZM6UHJYtE/`,m);
await m.react('🕒');
const aviso=`_💌 @${m.sender.split\`@\`[0]} ᩭ✎Eɴᴠɪᴀɴᴅᴏ ᴇʟ ᴠɪᴅᴇᴏ, ᴇsᴘᴇʀᴇ ᴜɴ ᴍᴏᴍᴇɴᴛᴏ..._`;
await conn.sendMessage(m.chat,{text:aviso,contextInfo:{externalAdReply:{title:packname,body:wm,thumbnail:icons,sourceUrl:yt},mentionedJid:[m.sender]}},{quoted:m});
try{
const api=`https://www.tikwm.com/api/?url=${link}&hd=1`;
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
await m.react("🌸");
}catch(e){
return conn.reply(m.chat,`_*< DESCARGAS - TIKTOK />*_\n\n🌟 Ocurrió un error inesperado.`,m);
}};
handler.help=['tiktok','tt'];
handler.tags=['descargas'];
handler.command=['tiktok','tt','tiktokdl','ttdl'];
handler.group=true;
handler.register=true;
export default handler;
function formatDate(ts){
const d=new Date(ts*1000);
return d.toLocaleString('es-ES',{timeZone:'America/Mexico_City'});
}
