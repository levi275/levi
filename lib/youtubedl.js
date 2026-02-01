import axios from "axios";
import yts from "yt-search";

// ==========================================
// 1. LÓGICA DEL SCRAPER (Ado - y2mate)
// ==========================================

const UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36";

function extractYouTubeId(input) {
    const s = String(input || "").trim();
    if (!s) return null;
    const m1 = s.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m1?.[1]) return m1[1];
    const m2 = s.match(/^[A-Za-z0-9_-]{11}$/);
    if (m2?.[0]) return m2[0];
    return null;
}

function pickQuality(type, quality) {
    const t = String(type || "").toLowerCase();
    const q = Number(quality);
    if (t === "audio" || t === "mp3") {
        const allowed = new Set([64, 96, 128, 160, 192, 256, 320]);
        return allowed.has(q) ? q : 128;
    }
    const allowed = new Set([144, 240, 360, 480, 720, 1080, 1440, 2160]);
    return allowed.has(q) ? q : 360; // Forzamos 360p para asegurar descarga rápida
}

function baseHeaders(ref) {
    return {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "es-US,es-419;q=0.9,es;q=0.8",
        Origin: ref,
        Referer: `${ref}/`,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "sec-ch-ua": '"Chromium";v="123", "Not(A:Brand";v="24", "Google Chrome";v="123"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"'
    };
}

// Función interna para obtener la clave del servidor
async function getSanityKey(timeout = 20000) {
    const ref = "https://frame.y2meta-uk.com";
    try {
        const res = await axios.get("https://cnv.cx/v2/sanity/key", {
            timeout,
            headers: { ...baseHeaders(ref), "Content-Type": "application/json" },
            validateStatus: () => true
        });

        if (res.status !== 200) throw new Error(`SANITY_KEY_HTTP_${res.status}`);
        const key = res?.data?.key;
        if (!key) throw new Error("SANITY_KEY_MISSING");

        return { key, ref };
    } catch (e) {
        throw e;
    }
}

function toForm(data) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(data)) p.set(k, String(v));
    return p;
}

function normalizeObj(data) {
    if (data && typeof data === "object") return data;
    if (typeof data === "string") {
        try { return JSON.parse(data); } catch { return null; }
    }
    return null;
}

// Lógica principal de descarga (Método Ado)
async function y2mateDirect(url, opts = {}) {
    const videoId = extractYouTubeId(url);
    if (!videoId) return { status: false, error: "INVALID_YOUTUBE_URL" };

    const typeRaw = String(opts.type || "audio").toLowerCase();
    const type = typeRaw === "video" || typeRaw === "mp4" ? "video" : "audio";
    const format = type === "video" ? "mp4" : "mp3";
    const quality = pickQuality(type, opts.quality);
    const timeout = Number(opts.timeout || 45000);

    try {
        const { key, ref } = await getSanityKey(Math.min(timeout, 20000));

        const payload = {
            link: `https://youtu.be/${videoId}`,
            format,
            audioBitrate: type === "audio" ? quality : 128,
            videoQuality: type === "video" ? quality : 720,
            filenameStyle: "pretty",
            vCodec: "h264"
        };

        const res = await axios.post("https://cnv.cx/v2/converter", toForm(payload), {
            timeout,
            headers: {
                ...baseHeaders(ref),
                Accept: "*/*",
                "Content-Type": "application/x-www-form-urlencoded",
                key
            },
            validateStatus: () => true
        });

        if (res.status !== 200) return { status: false, error: `CONVERTER_HTTP_${res.status}` };

        const obj = normalizeObj(res.data);
        const direct = obj?.url;

        if (!direct) return { status: false, error: "NO_URL_IN_RESPONSE", raw: obj ?? res.data };

        return { status: true, videoId, type, format, quality, url: direct };
    } catch (error) {
        return { status: false, error: error.message };
    }
}

// ==========================================
// 2. ADAPTADORES PARA TU BOT (ytmp3 / ytmp4)
// ==========================================
// Esto es lo que hace que funcione con TU comando handler.js

export async function ytmp3(link) {
    // 1. Usamos el método de Ado para sacar el link
    const result = await y2mateDirect(link, { type: 'audio', quality: 128 });
    
    if (!result.status) {
        return { 
            status: false, 
            message: result.error || "Error al obtener enlace de audio" 
        };
    }

    // 2. Intentamos sacar el título rápido con yt-search para que el archivo tenga nombre
    let title = "audio_music";
    try {
        // Buscamos por ID que es más rápido y exacto
        const meta = await yts({ videoId: result.videoId });
        if (meta) title = meta.title;
    } catch (e) {
        // Si falla el título, no importa, ya tenemos el link que es lo importante
    }

    // 3. Devolvemos la estructura EXACTA que tu handler.js pide:
    return {
        status: true,
        metadata: { title: title },
        download: { 
            url: result.url // Aquí va el enlace directo
        }
    };
}

export async function ytmp4(link) {
    // 1. Usamos el método de Ado (calidad 360 para que WhatsApp no falle por tamaño)
    const result = await y2mateDirect(link, { type: 'video', quality: 360 });
    
    if (!result.status) {
        return { 
            status: false, 
            message: result.error || "Error al obtener enlace de video" 
        };
    }

    let title = "video_mp4";
    try {
        const meta = await yts({ videoId: result.videoId });
        if (meta) title = meta.title;
    } catch (e) {}

    return {
        status: true,
        metadata: { title: title },
        download: { 
            url: result.url 
        }
    };
}
