import youtubedl from 'youtube-dl-exec';

/**
 * Función auxiliar para obtener datos crudos de yt-dlp
 */
async function getInfo(url, flags) {
    try {
        return await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            referer: 'https://www.youtube.com/',
            ...flags
        });
    } catch (e) {
        console.error("Error en youtube-dl-exec:", e);
        return null;
    }
}

/**
 * Descarga de AUDIO (MP3/M4A)
 */
export async function ytmp3(link) {
    try {
        // Pedimos el mejor audio disponible (m4a suele ser mejor para WhatsApp que mp3 directo)
        const output = await getInfo(link, {
            format: 'bestaudio[ext=m4a]/bestaudio/best'
        });

        if (!output || !output.url) {
            return { status: false, message: "No se pudo obtener el enlace de audio." };
        }

        return {
            status: true,
            metadata: {
                title: output.title,
                thumbnail: output.thumbnail,
                duration: output.duration,
                author: output.uploader,
                views: output.view_count,
                url: output.webpage_url
            },
            download: {
                // yt-dlp devuelve el enlace directo en la propiedad .url
                url: output.url, 
                filename: `${output.title}.mp3`
            }
        };
    } catch (error) {
        return { status: false, message: error.message };
    }
}

/**
 * Descarga de VIDEO (MP4)
 */
export async function ytmp4(link) {
    try {
        // Pedimos formato mp4 con video Y audio integrados.
        // 'best[ext=mp4]' intenta conseguir un solo archivo (no video y audio separados)
        // limitamos a altura 720 para que no pese demasiado para WhatsApp
        const output = await getInfo(link, {
            format: 'best[ext=mp4][height<=720]/best[ext=mp4]/best'
        });

        if (!output || !output.url) {
            return { status: false, message: "No se pudo obtener el enlace de video." };
        }

        return {
            status: true,
            metadata: {
                title: output.title,
                thumbnail: output.thumbnail,
                duration: output.duration,
                author: output.uploader,
                views: output.view_count,
                url: output.webpage_url
            },
            download: {
                url: output.url,
                filename: `${output.title}.mp4`
            }
        };
    } catch (error) {
        return { status: false, message: error.message };
    }
}

/**
 * Función combinada (Opcional, por si la usas en otro lado)
 */
export async function ytdlv2(link) {
    const audioPromise = ytmp3(link);
    const videoPromise = ytmp4(link);
    
    const [audio, video] = await Promise.all([audioPromise, videoPromise]);

    return {
        status: true,
        metadata: audio.status ? audio.metadata : (video.status ? video.metadata : {}),
        downloads: {
            audio: audio.status ? audio.download.url : null,
            video: video.status ? video.download.url : null
        }
    };
}