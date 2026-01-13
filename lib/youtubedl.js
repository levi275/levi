import axios from "axios";
import yts from "yt-search";
import { createDecipheriv } from "crypto";

// === UTILIDADES PRIVADAS ===

const makeId = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

const decode = (enc) => {
    try {
        const secret_key = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
        const data = Buffer.from(enc, 'base64');
        const iv = data.slice(0, 16);
        const content = data.slice(16);
        const key = Buffer.from(secret_key, 'hex');

        const decipher = createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = Buffer.concat([decipher.update(content), decipher.final()]);

        return JSON.parse(decrypted.toString());
    } catch (error) {
        throw new Error(error.message);
    }
}

// === LÓGICA PRINCIPAL (SAVETUBE) ===

async function savetube(link, quality, type) {
    try {
        // 1. Obtener CDN
        const cdnResponse = await axios.get("https://media.savetube.me/api/random-cdn");
        const cdn = cdnResponse.data.cdn;

        // 2. Obtener Info encriptada
        const infoUrl = `https://${cdn}/v2/info`;
        const infoBody = { 'url': link };
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://yt.savetube.me/1kejjj1?id=362796039'
        };

        const infoReq = await axios.post(infoUrl, infoBody, { headers });
        const info = decode(infoReq.data.data); // Desencriptar la info para sacar la KEY

        // 3. Solicitar descarga
        const downloadUrl = `https://${cdn}/download`;
        const downloadBody = {
            'downloadType': type, // "audio" o "video"
            'quality': quality.toString(),
            'key': info.key
        };
        const downloadHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://yt.savetube.me/start-download?from=1kejjj1%3Fid%3D362796039'
        };

        const downloadReq = await axios.post(downloadUrl, downloadBody, { headers: downloadHeaders });

        return {
            status: true,
            link: downloadReq.data.data.downloadUrl, // Enlace directo
            filename: info.title,
            quality: quality
        };
    } catch (error) {
        console.error("Savetube Error:", error.message);
        return { status: false, message: error.message };
    }
}

// === FUNCIONES EXPORTADAS PARA TU COMANDO ===

export async function ytmp3(link) {
    // Calidad por defecto 128kbps para audio
    const result = await savetube(link, 128, "audio");
    if (!result.status) return { status: false, message: result.message };

    // Buscamos metadatos extra con yt-search para que tu comando tenga título e imagen
    let meta = {};
    try {
        const search = await yts(link);
        meta = search.all[0] || {};
    } catch (e) { }

    return {
        status: true,
        metadata: {
            title: result.filename || meta.title,
            thumbnail: meta.thumbnail,
            duration: meta.timestamp,
            author: meta.author?.name
        },
        download: {
            url: result.link,
            filename: result.filename
        }
    };
}

export async function ytmp4(link) {
    // Calidad por defecto 360p para video
    const result = await savetube(link, 360, "video");
    if (!result.status) return { status: false, message: result.message };

    let meta = {};
    try {
        const search = await yts(link);
        meta = search.all[0] || {};
    } catch (e) { }

    return {
        status: true,
        metadata: {
            title: result.filename || meta.title,
            thumbnail: meta.thumbnail,
            duration: meta.timestamp,
            author: meta.author?.name
        },
        download: {
            url: result.link,
            filename: result.filename
        }
    };
}