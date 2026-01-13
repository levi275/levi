import axios from "axios";
import yts from "yt-search";

// === CONFIGURACIÓN Y UTILIDADES DEL NUEVO MÉTODO (Ado) ===

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
    return allowed.has(q) ? q : 360; // Default 360p para video
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
        throw new Error("Error obteniendo clave de servidor: " + e.message);
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
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
    return null;
}

// === FUNCIÓN PRINCIPAL DE DESCARGA (Ado) ===

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

// === ADAPTADORES PARA TU BOT (ytmp3 / ytmp4) ===

export async function ytmp3(link) {
    // 1. Conseguir Metadata (Título, imagen, etc)
    let meta = { title: "Audio MP3", thumbnail: "" };
    try {
        const search = await yts(link);
        const vid = search.all[0] || {};
        meta = {
            title: vid.title,
            thumbnail: vid.thumbnail,
            duration: vid.timestamp,
            author: vid.author?.name,
            url: vid.url
        };
    } catch (e) {
        // Si falla la búsqueda, seguimos solo con la descarga
        console.log("Fallo al obtener metadatos, intentando descargar igual...");
    }

    // 2. Ejecutar descarga con el nuevo método
    const result = await y2mateDirect(link, { type: 'audio', quality: 128 });

    if (!result.status) {
        return { status: false, message: result.error };
    }

    return {
        status: true,
        metadata: meta,
        download: {
            url: result.url,
            filename: `${meta.title || 'audio'}.mp3`
        }
    };
}

export async function ytmp4(link) {
    // 1. Conseguir Metadata
    let meta = { title: "Video MP4", thumbnail: "" };
    try {
        const search = await yts(link);
        const vid = search.all[0] || {};
        meta = {
            title: vid.title,
            thumbnail: vid.thumbnail,
            duration: vid.timestamp,
            author: vid.author?.name,
            url: vid.url
        };
    } catch (e) { }

    // 2. Ejecutar descarga (360p para ser rápido y compatible con WhatsApp)
    const result = await y2mateDirect(link, { type: 'video', quality: 360 });

    if (!result.status) {
        return { status: false, message: result.error };
    }

    return {
        status: true,
        metadata: meta,
        download: {
            url: result.url,
            filename: `${meta.title || 'video'}.mp4`
        }
    };
}

// Función extra si alguna vez necesitas ambas cosas
export async function ytdlv2(link) {
    const meta = await yts(link).then(r => r.all[0]).catch(() => ({}));
    const audio = await y2mateDirect(link, { type: 'audio' });
    const video = await y2mateDirect(link, { type: 'video' });

    return {
        status: true,
        metadata: {
            title: meta.title,
            thumbnail: meta.thumbnail,
            url: meta.url
        },
        downloads: {
            audio: audio.status ? audio.url : null,
            video: video.status ? video.url : null
        }
    };
}