import axios from "axios";
import yts from "yt-search";

// Configuración del nuevo método
const KEY = "dfcb6d76f2f6a9894gjkege8a4ab232222";
const AGENT = "Mozilla/5.0 (Android 13; Mobile; rv:146.0) Gecko/146.0 Firefox/146.0";
const REFERER = "https://y2down.cc/enSB/";

/**
 * Función interna para manejar el proceso de descarga y polling (espera)
 */
async function _fetchFromSavenow(url, format) {
    try {
        // 1. Iniciar la solicitud de conversión
        const initUrl = `https://p.savenow.to/ajax/download.php?copyright=0&format=${format}&url=${encodeURIComponent(url)}&api=${KEY}`;
        
        const { data: initData } = await axios.get(initUrl, {
            headers: { "User-Agent": AGENT, "Referer": REFERER }
        });

        if (!initData.success) {
            throw new Error(initData.text || "Error al iniciar la descarga");
        }

        const id = initData.id;
        const progressUrl = `https://p.savenow.to/api/progress?id=${id}`;
        
        // 2. Polling: Esperar a que el servidor termine de procesar el archivo
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos entre intentos
            
            const { data: status } = await axios.get(progressUrl, {
                headers: { "User-Agent": AGENT, "Referer": REFERER }
            });
            
            // progress === 1000 significa que está completado
            if (status.progress === 1000) {
                return {
                    title: initData.info?.title || "youtube_file",
                    link: status.download_url,
                    thumbnail: initData.info?.image
                };
            }

            if (status.progress === -1) {
                throw new Error("El servidor falló al procesar el archivo.");
            }
        }
    } catch (error) {
        throw new Error("Savenow Error: " + error.message);
    }
}

/**
 * Función principal para manejar las descargas individuales
 */
async function handleDownload(link, type) {
    const videoId = getYouTubeVideoId(link);
    if (!videoId) return { status: false, message: "URL de YouTube inválida." };

    try {
        // Definir formato basado en tipo (Audio = mp3, Video = 360p por defecto)
        const format = type === 'mp3' ? 'mp3' : '360';
        
        // Ejecutamos la búsqueda de info y la descarga en paralelo
        const [metadata, downloadData] = await Promise.all([
            yts({ videoId }).catch(() => ({})),
            _fetchFromSavenow(link, format)
        ]);

        const title = metadata.title || downloadData.title;

        return {
            status: true,
            metadata: {
                title: title,
                thumbnail: metadata.thumbnail || downloadData.thumbnail,
                duration: metadata.duration?.timestamp,
                author: metadata.author?.name,
                url: metadata.url
            },
            download: {
                quality: type === 'mp3' ? '128kbps' : '360p',
                url: downloadData.link,
                filename: `${title}.${type}`
            }
        };
    } catch (error) {
        return { status: false, message: error.message };
    }
}

function getYouTubeVideoId(url) {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:.*v=|[^\/]+\/.+\/|.*embed\/))([^&?\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Interfaces públicas
export const ytmp3 = (link) => handleDownload(link, 'mp3');
export const ytmp4 = (link) => handleDownload(link, 'mp4');

export async function ytdlv2(link) {
    try {
        const videoId = getYouTubeVideoId(link);
        if (!videoId) return { status: false, message: "URL de YouTube inválida." };

        const [metadata, audioData, videoData] = await Promise.allSettled([
            yts({ videoId }),
            _fetchFromSavenow(link, 'mp3'),
            _fetchFromSavenow(link, '360')
        ]);

        const meta = metadata.status === 'fulfilled' ? metadata.value : {};
        
        return {
            status: true,
            metadata: {
                title: meta.title || "YouTube Video",
                thumbnail: meta.thumbnail,
                duration: meta.duration?.timestamp,
                author: meta.author?.name,
                url: meta.url
            },
            downloads: {
                audio: audioData.status === 'fulfilled' ? audioData.value.link : null,
                video: videoData.status === 'fulfilled' ? videoData.value.link : null
            }
        };
    } catch (error) {
        return { status: false, message: error.message };
    }
}