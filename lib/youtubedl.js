import ytdl from "@distube/ytdl-core";
import yts from "yt-search";

/**
 * CONFIGURACIÓN DEL AGENTE
 * YouTube suele bloquear IPs de servidores. Si te da error 429,
 * necesitarás exportar tus cookies como dice la documentación e insertarlas aquí.
 */
const agent = ytdl.createAgent(
    // Pega aquí tus cookies si es necesario (array de objetos):
    undefined, 
    {
        // Opciones de red para evitar bloqueos
        pipelining: 5,
        maxRedirections: 2,
    }
);

/**
 * Función validadora de URL
 */
function isValidYoutube(url) {
    return ytdl.validateURL(url);
}

/**
 * Función principal de descarga interna
 */
async function handleDownload(link, type) {
    if (!isValidYoutube(link)) {
        return { status: false, message: "URL de YouTube inválida." };
    }

    try {
        // 1. Obtener información completa del video
        const info = await ytdl.getInfo(link, { agent });
        
        // 2. Seleccionar el formato adecuado según el tipo (mp3/mp4)
        let format;
        let qualityLabel = "";

        if (type === 'mp3') {
            // Buscamos solo audio con la mejor calidad posible
            format = ytdl.chooseFormat(info.formats, { 
                quality: 'highestaudio', 
                filter: 'audioonly' 
            });
            qualityLabel = "128kbps";
        } else {
            // Buscamos video que tenga audio y video integrados (para evitar archivos mudos)
            // '18' es el itag estándar para 360p con audio, muy compatible.
            // Si quieres HD, usa 'highest' pero ojo con el tamaño.
            try {
                format = ytdl.chooseFormat(info.formats, { quality: '18' }); 
            } catch (e) {
                // Si falla el itag 18, busca cualquier cosa con audio y video
                format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo' });
            }
            qualityLabel = format.qualityLabel || "360p";
        }

        if (!format || !format.url) {
            throw new Error("No se encontró un formato de descarga válido.");
        }

        // 3. Preparar metadatos
        const details = info.videoDetails;
        const title = details.title;
        const thumb = details.thumbnails[details.thumbnails.length - 1].url; // La miniatura más grande

        return {
            status: true,
            metadata: {
                title: title,
                thumbnail: thumb,
                duration: details.lengthSeconds,
                author: details.author.name,
                url: details.video_url,
                views: details.viewCount
            },
            download: {
                quality: qualityLabel,
                url: format.url, // URL directa de Google (googlevideo.com)
                filename: `${title}.${type}`
            }
        };

    } catch (error) {
        return { status: false, message: error.message };
    }
}

// --- Exportaciones (Iguales a tu código original) ---

export const ytmp3 = (link) => handleDownload(link, 'mp3');
export const ytmp4 = (link) => handleDownload(link, 'mp4');

export async function ytdlv2(link) {
    if (!isValidYoutube(link)) {
        return { status: false, message: "URL de YouTube inválida." };
    }

    try {
        const info = await ytdl.getInfo(link, { agent });
        const details = info.videoDetails;

        // Obtener enlaces para ambos formatos
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
        
        let videoFormat;
        try {
            videoFormat = ytdl.chooseFormat(info.formats, { quality: '18' });
        } catch (e) {
            videoFormat = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo' });
        }

        return {
            status: true,
            metadata: {
                title: details.title,
                thumbnail: details.thumbnails[details.thumbnails.length - 1].url,
                duration: details.lengthSeconds,
                author: details.author.name,
                url: details.video_url
            },
            downloads: {
                audio: audioFormat ? audioFormat.url : null,
                video: videoFormat ? videoFormat.url : null
            }
        };
    } catch (error) {
        return { status: false, message: error.message };
    }
}