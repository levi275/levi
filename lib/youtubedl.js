import axios from "axios";
import yts from "yt-search";

// ==========================================
// 1. LÓGICA DEL SCRAPER (Ytdown.to - Método Form Data)
// ==========================================

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const BASE_URL = "https://ytdown.to";
const API_URL = "https://api.ytdown.to/api"; // Endpoint real del backend

function createHeaders() {
    return {
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "es-ES,es;q=0.9",
        "Origin": BASE_URL,
        "Referer": `${BASE_URL}/`,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", // VITAL: Esto es lo que faltaba
        "X-Requested-With": "XMLHttpRequest"
    };
}

// Función auxiliar para seleccionar la mejor calidad disponible
function findBestKey(links, type, targetQuality) {
    // links es un objeto { "18": {...}, "137": {...} } o similar
    const keys = Object.values(links);
    
    // Si es audio (mp3)
    if (type === 'mp3') {
        // Intentar buscar 128kbps, si no, el primero que encuentre
        const best = keys.find(k => k.q === '128kbps') || keys.find(k => k.q.includes('128')) || keys[0];
        return best ? best.k : null;
    }

    // Si es video (mp4)
    if (type === 'mp4') {
        // Buscamos la calidad objetivo (ej: "360p")
        // targetQuality suele ser número (360), lo convertimos a string
        const targetStr = String(targetQuality); 
        
        // Prioridad 1: Coincidencia exacta (ej: 360p)
        let best = keys.find(k => k.q.includes(targetStr + 'p'));
        
        // Prioridad 2: Si pedimos 360 y no hay, intentar 480p (para no ir a 1080p directo y pesar mucho)
        if (!best && targetQuality === 360) best = keys.find(k => k.q.includes('480p'));
        
        // Prioridad 3: Video "auto" o el primero disponible
        if (!best) best = keys.find(k => k.q === 'auto') || keys[0];
        
        return best ? best.k : null;
    }
    return null;
}

// Lógica principal
async function ytdownDirect(url, opts = {}) {
    try {
        const type = opts.type === 'video' ? 'mp4' : 'mp3';
        const targetQuality = opts.quality || 360;

        // --- PASO 1: ANALYZE (Simula pegar el link y dar buscar) ---
        const analyzeParams = new URLSearchParams();
        analyzeParams.append('q', url);
        analyzeParams.append('vt', 'home'); // Parámetro común en estos sitios

        const analyzeRes = await axios.post(`${API_URL}/analyze`, analyzeParams, {
            headers: createHeaders()
        });

        const data = analyzeRes.data;
        if (!data || !data.vid) throw new Error("API_ANALYZE_FAIL: No video found");

        // Obtenemos el VID y los LINKS del objeto de respuesta
        const vid = data.vid;
        const linksData = data.links; // Contiene { mp4: {...}, mp3: {...} }

        // Seleccionamos la 'key' (k) correcta según lo que queremos descargar
        const formatLinks = linksData[type] || linksData['mp4']; // Fallback a mp4 si mp3 no existe
        if (!formatLinks) throw new Error(`NO_LINKS_FOR_${type.toUpperCase()}`);

        const k = findBestKey(formatLinks, type, targetQuality);
        if (!k) throw new Error("NO_QUALITY_KEY_FOUND");

        // --- PASO 2: CONVERT (Simula dar clic al botón Descargar del modal) ---
        const convertParams = new URLSearchParams();
        convertParams.append('vid', vid);
        convertParams.append('k', k);

        const convertRes = await axios.post(`${API_URL}/convert`, convertParams, {
            headers: createHeaders()
        });

        const convertData = convertRes.data;
        
        // A veces devuelve { status: "ok", dlink: "..." }
        if (convertData.status !== 'ok' || !convertData.dlink) {
            throw new Error("CONVERT_FAIL: No link returned");
        }

        return {
            status: true,
            videoId: vid,
            url: convertData.dlink, // El enlace directo de descarga
            quality: convertData.q_text || targetQuality
        };

    } catch (error) {
        return { status: false, error: error.message };
    }
}


// ==========================================
// 2. ADAPTADORES PARA TU BOT (Handler.js)
// ==========================================

export async function ytmp3(link) {
    const result = await ytdownDirect(link, { type: 'audio' });

    if (!result.status) {
        return { 
            status: false, 
            message: `Error Ytdown: ${result.error}` 
        };
    }

    // Buscamos título bonito con yt-search
    let title = "audio_mp3";
    try {
        const meta = await yts({ videoId: result.videoId });
        if (meta && meta.title) title = meta.title;
    } catch (e) {}

    return {
        status: true,
        metadata: { title: title },
        download: { 
            url: result.url 
        }
    };
}

export async function ytmp4(link) {
    // Pedimos calidad 360 para evitar archivos gigantes en WhatsApp
    const result = await ytdownDirect(link, { type: 'video', quality: 360 });

    if (!result.status) {
        return { 
            status: false, 
            message: `Error Ytdown: ${result.error}` 
        };
    }

    let title = "video_mp4";
    try {
        const meta = await yts({ videoId: result.videoId });
        if (meta && meta.title) title = meta.title;
    } catch (e) {}

    return {
        status: true,
        metadata: { title: title },
        download: { 
            url: result.url 
        }
    };
}