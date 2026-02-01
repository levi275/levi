import axios from "axios";
import yts from "yt-search";

// ==========================================
// 1. LÓGICA DEL SCRAPER (Ytdown.to / No-Mate)
// ==========================================

const UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36";
const BASE_URL = "https://ytdown.to"; // Sitio base
const API_URL = "https://api.ytdown.to/api"; // Endpoint usual (puede variar a loader o similar)

function extractYouTubeId(input) {
    const s = String(input || "").trim();
    if (!s) return null;
    const m1 = s.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m1?.[1]) return m1[1];
    const m2 = s.match(/^[A-Za-z0-9_-]{11}$/);
    if (m2?.[0]) return m2[0];
    return null;
}

function baseHeaders(ref) {
    return {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "es-US,es-419;q=0.9,es;q=0.8",
        Origin: ref,
        Referer: `${ref}/`,
        "Content-Type": "application/json",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
    };
}

// Función principal de descarga para Ytdown
async function ytdownDirect(url, opts = {}) {
    const videoId = extractYouTubeId(url);
    if (!videoId) return { status: false, error: "INVALID_YOUTUBE_URL" };

    const typeRaw = String(opts.type || "audio").toLowerCase();
    const isVideo = typeRaw === "video" || typeRaw === "mp4";
    // ytdown suele usar k_format o alias similares
    const targetFormat = isVideo ? "mp4" : "mp3"; 

    try {
        // PASO 1: Analizar el video (Search/Analyze)
        // Nota: Muchos de estos sitios usan una API backend común.
        // Si ytdown.to cambia, la estructura suele ser POST /analyze o /search
        const analyzePayload = {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            q: `https://www.youtube.com/watch?v=${videoId}`, // A veces pide 'q'
            lang: "es"
        };

        // Intentamos el endpoint de análisis (común en clones 'no-mate')
        // Si falla, se puede intentar con endpoints de yt1s o similares que usa ytdown.to
        const analyzeRes = await axios.post(`${API_URL}/analyze`, analyzePayload, {
            headers: baseHeaders(BASE_URL)
        }).catch(() => null);

        // Fallback: Si la API directa falla, a veces usan un endpoint 'convert' directo
        if (!analyzeRes || !analyzeRes.data) {
             throw new Error("API_ANALYZE_FAILED");
        }

        const data = analyzeRes.data;
        if (!data.links) throw new Error("NO_LINKS_FOUND");

        // PASO 2: Seleccionar la calidad
        // Buscamos en data.links[targetFormat] o data.links
        const formats = data.links[targetFormat] || data.links;
        let selectedKey = null;

        // Lógica simple para elegir la mejor calidad disponible o la solicitada
        // Convertimos el objeto en array si es necesario
        const formatList = Object.values(formats).map(f => ({
            key: f.key,
            quality: f.q || f.quality || "",
            size: f.size || ""
        }));

        if (isVideo) {
            // Preferir 360p o 480p para WhatsApp (o lo que pida opts.quality)
            const targetQ = opts.quality ? String(opts.quality) : "360";
            const found = formatList.find(f => f.quality.includes(targetQ + "p")) || formatList[0];
            selectedKey = found?.key;
        } else {
            // Audio (normalmente 128kbps o 'mp3128')
            const found = formatList.find(f => f.quality.includes("128")) || formatList[0];
            selectedKey = found?.key;
        }

        if (!selectedKey) throw new Error("NO_MATCHING_QUALITY");

        // PASO 3: Convertir (Convert/GetLink)
        const convertPayload = {
            vid: data.vid,
            k: selectedKey
        };

        const convertRes = await axios.post(`${API_URL}/convert`, convertPayload, {
            headers: baseHeaders(BASE_URL)
        });

        if (convertRes.data.status !== "ok" && convertRes.data.c_status !== "CONVERTED") {
            throw new Error("CONVERSION_FAILED_OR_PROCESSING");
        }

        // URL Final
        const downloadUrl = convertRes.data.dlink;
        if (!downloadUrl) throw new Error("NO_DOWNLOAD_URL");

        return { 
            status: true, 
            videoId, 
            type: targetFormat, 
            url: downloadUrl 
        };

    } catch (error) {
        // Fallback silencioso a mensaje de error
        return { status: false, error: error.message };
    }
}

// ==========================================
// 2. ADAPTADORES PARA TU BOT (ytmp3 / ytmp4)
// ==========================================

export async function ytmp3(link) {
    // 1. Usamos la nueva función ytdownDirect
    const result = await ytdownDirect(link, { type: 'audio' });

    // Si falla ytdown, el bot debería saberlo
    if (!result.status) {
        return { 
            status: false, 
            message: result.error || "Error al obtener enlace de audio (ytdown)" 
        };
    }

    // 2. Obtener metadatos con yt-search para un título bonito
    let title = "audio_music";
    try {
        const meta = await yts({ videoId: result.videoId });
        if (meta) title = meta.title;
    } catch (e) {}

    // 3. Estructura para el handler
    return {
        status: true,
        metadata: { title: title },
        download: { 
            url: result.url 
        }
    };
}

export async function ytmp4(link) {
    // 1. Usamos ytdownDirect para video (360p por defecto en la lógica)
    const result = await ytdownDirect(link, { type: 'video', quality: 360 });

    if (!result.status) {
        return { 
            status: false, 
            message: result.error || "Error al obtener enlace de video (ytdown)" 
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