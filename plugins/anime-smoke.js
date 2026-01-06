import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os'; 

// Función auxiliar para convertir GIF a MP4 usando FFmpeg
// Esto hace exactamente lo que hacía el script de Python pero automático
function gifToMp4(gifBuffer) {
    return new Promise((resolve, reject) => {
        const tempGif = path.join(tmpdir(), `${Date.now()}.gif`);
        const tempMp4 = path.join(tmpdir(), `${Date.now()}.mp4`);

        // Escribimos el buffer del GIF en un archivo temporal
        fs.writeFileSync(tempGif, gifBuffer);

        // Ejecutamos FFmpeg
        // -pix_fmt yuv420p es CRUCIAL para que WhatsApp reconozca el video
        // -c:v libx264 usa el codec estándar
        // -movflags +faststart ayuda a que cargue rápido
        const ffmpeg = spawn('ffmpeg', [
            '-y', 
            '-i', tempGif, 
            '-c:v', 'libx264', 
            '-pix_fmt', 'yuv420p', 
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Asegura dimensiones pares (necesario para mp4)
            '-movflags', '+faststart',
            tempMp4
        ]);

        ffmpeg.on('close', (code) => {
            fs.unlinkSync(tempGif); // Borrar el GIF temporal
            if (code === 0) {
                const mp4Buffer = fs.readFileSync(tempMp4);
                fs.unlinkSync(tempMp4); // Borrar el MP4 temporal
                resolve(mp4Buffer);
            } else {
                reject(new Error(`FFmpeg falló con código ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            fs.unlinkSync(tempGif);
            reject(err);
        });
    });
}

let handler = async (m, { conn }) => {
    const smokeGifs = [
        'https://i.pinimg.com/originals/5c/8e/bb/5c8ebbfa78bef8b0a51259d10fbbc929.gif',
        'https://i.pinimg.com/originals/29/7c/bb/297cbb4ffe4b7a96cbc1d913917dad27.gif',
        'https://i.pinimg.com/originals/fb/56/48/fb5648dc6e39b7b724cb0daf3693610f.gif',
        // ... tus otros enlaces
    ];

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;
    let nameSender = conn.getName(m.sender);
    let nameTarget = conn.getName(who);

    let caption = who === m.sender 
        ? `\`${nameSender}\` *está fumando* 🚬.` 
        : `\`${nameSender}\` *está fumando con* \`${nameTarget}\` 🚬.`;
    
    const randomGif = smokeGifs[Math.floor(Math.random() * smokeGifs.length)];

    await m.react('🚬');

    try {
        const response = await axios({
            method: 'get',
            url: randomGif,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Referer': 'https://www.pinterest.com/'
            }
        });

        let buffer = Buffer.from(response.data);

        // --- AQUÍ ESTÁ LA MAGIA ---
        // Intentamos convertir a MP4
        try {
            buffer = await gifToMp4(buffer);
            // Si la conversión funciona, enviamos como video
            await conn.sendMessage(m.chat, { 
                video: buffer, 
                caption: caption, 
                gifPlayback: true, // Esto hace que se reproduzca solo en bucle
                mentions: [who, m.sender],
                mimetype: 'video/mp4' 
            }, { quoted: m });
        } catch (conversionError) {
            console.error("Error al convertir GIF a MP4:", conversionError);
            throw new Error('Fallo conversión'); // Lanzamos error para ir al catch de abajo
        }

    } catch (error) {
        // FALLBACK: Si falla FFmpeg o la descarga, enviamos como IMAGEN GIF
        // Esto es más seguro si el servidor no soporta video
        console.log("Enviando como GIF normal por error...");
        await conn.sendMessage(m.chat, { 
            image: { url: randomGif }, 
            caption: caption,
            mentions: [who, m.sender],
            mimetype: 'image/gif' // Importante: mimetype image/gif, NO video
        }, { quoted: m });
    }
};

handler.help = ['smoke', 'fumar'];
handler.tags = ['anime'];
handler.command = ['smoke', 'fumar'];
handler.group = true;

export default handler;