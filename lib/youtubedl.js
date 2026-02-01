import axios from "axios";
import yts from "yt-search";

// ==========================================
// 1. CONFIGURACIÓN Y HEADERS (Optimizado)
// ==========================================

// Usamos un User-Agent de PC para mayor estabilidad en los enlaces generados
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

function extractYouTubeId(input) {
    const s = String(input || "").trim();
    if (!s) return null;
    // Regex mejorado para detectar IDs en links cortos, largos y shorts
    const patterns = [
        /(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{11})/,
        /^([A-Za-z0-9_-]{11})$/
    ];
    for (const p of patterns) {
        const match = s.match(p);
        if (match?.[1]) return match[1];
        if (match?.[0] && !match[1]) return match[0]; // Caso del ID suelto
    }
    return null;
}

function pickQuality(type, quality) {
    const t = String(type || "").toLowerCase();
    const q = Number(quality);
    
    if (t === "audio" || t === "mp3") {
        const allowed = [128, 192, 320];
        return allowed.includes(q) ? q : 128; // 128kbps es estándar y seguro
    }
    
    // Para video en WhatsApp, 360p es el rey. 720p a veces pesa mucho y falla al subir.
    const allowed = [360, 480, 720, 1080];
    return allowed.includes(q) ? q : 360; 
}

function baseHeaders(ref) {
    return {
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": ref,
        "Referer": `${ref}/`,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Content-Type": "application/x-www-form-urlencoded"
    };
}

// ==========================================
// 2. LÓGICA DEL SCRAPER (API ADO/Y2MATE)
// ==========================================

async function getSanityKey() {
    const ref = "https://frame.y2meta-uk.com";
    try {
        const { data } = await axios.get("https://cnv.cx/v2/sanity/key", {
            headers: baseHeaders(ref),
            timeout: 10000 // 10s timeout
        });
        if (!data?.key) throw new Error("NO_KEY_FOUND");
        return { key: data.key, ref };
    } catch (e) {
        throw new Error(`Error obteniendo clave API: ${e.message}`);
    }
}

async function y2mateDirect(url, opts = {}) {
    const videoId = extractYouTubeId(url);
    if (!videoId) return { status: false, error: "ID_INVALIDO" };

    const typeRaw = String(opts.type || "audio").toLowerCase();
    const isVideo = typeRaw === "video" || typeRaw === "mp4";
    const type = isVideo ? "video" : "audio";
    const format = isVideo ? "mp4" : "mp3";
    const quality = pickQuality(type, opts.quality);

    try {
        const { key, ref } = await getSanityKey();

        const payload = new URLSearchParams({
            link: `https://youtu.be/${videoId}`,
            format: format,
            audioBitrate: isVideo ? 128 : quality, // Si es video, audio base. Si es audio, calidad elegida.
            videoQuality: isVideo ? quality : 720, // Si es audio, esto se ignora.
            filenameStyle: "basic", // IMPORTANTE: "basic" evita nombres con emojis que rompen WhatsApp
            vCodec: "h264" // IMPORTANTE: Fuerza formato compatible con WhatsApp
        });

        const { data } = await axios.post("https://cnv.cx/v2/converter", payload, {
            headers: {
                ...baseHeaders(ref),
                "key": key
            },
            timeout: 30000 // 30s timeout para conversión
        });

        // La API a veces devuelve JSON stringificado o directo
        const result = typeof data === 'string' ? JSON.parse(data) : data;

        if (!result.url) {
            // Intento de rescate si la API falla con 360p, probamos 480p (fallback)
            if (isVideo && quality === 360) {
                return y2mateDirect(url, { ...opts, quality: 480 });
            }
            return { status: false, error: "NO_URL_GENERATED" };
        }

        return { 
            status: true, 
            videoId, 
            type, 
            format, 
            quality, 
            url: result.url 
        };

    } catch (error) {
        return { status: false, error: error.message };
    }
}

// ==========================================
// 3. EXPORTACIONES (ADAPTADORES)
// ==========================================

export async function ytmp3(link) {
    // 1. Obtenemos metadatos primero (más rápido para mostrar info si falla descarga)
    let title = "Audio Music";
    try {
        const videoId = extractYouTubeId(link);
        if (videoId) {
            const meta = await yts({ videoId });
            title = meta.title || title;
        }
    } catch (e) {}

    // 2. Solicitamos el enlace
    const result = await y2mateDirect(link, { type: 'audio', quality: 128 });

    if (!result.status) {
        return { 
            status: false, 
            message: "No se pudo generar el enlace de audio." 
        };
    }

    return {
        status: true,
        metadata: { title },
        download: { 
            url: result.url,
            filename: `${title}.mp3`
        }
    };
}

export async function ytmp4(link) {
    // 1. Obtenemos metadatos
    let title = "Video MP4";
    try {
        const videoId = extractYouTubeId(link);
        if (videoId) {
            const meta = await yts({ videoId });
            title = meta.title || title;
        }
    } catch (e) {}

    // 2. Solicitamos el video (Forzamos 360p para máxima compatibilidad)
    const result = await y2mateDirect(link, { type: 'video', quality: 360 });

    if (!result.status) {
        return { 
            status: false, 
            message: "No se pudo generar el enlace de video." 
        };
    }

    return {
        status: true,
        metadata: { title },
        download: { 
            url: result.url,
            filename: `${title}.mp4`
        }
    };
}