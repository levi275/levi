import axios from "axios";
import FormData from "form-data";
import { fileTypeFromBuffer } from "file-type";
import crypto from "crypto";

const handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || '';

  // Validación de archivo
  if (!mime || !/image\/(png|jpe?g)/.test(mime)) {
    return conn.reply(m.chat, `❌ Por favor, responde a una *imagen válida* (png o jpg).`, m);
  }

  await m.react("⏳"); // Espera inicial

  try {
    // 1. Descarga de la imagen original
    let media = await q.download();
    if (!media) throw new Error("No se pudo descargar la imagen.");

    await conn.reply(m.chat, `✨ *Procesando tu imagen en HD...* (Esto puede tomar unos segundos)`, m);

    // 2. Procesamiento directo con iLoveIMG (Scraper integrado)
    const randomName = `image_${crypto.randomBytes(3).toString("hex")}.jpg`;
    const upscaledBuffer = await scrapeUpscaleFromFile(media, randomName, 2);

    // 3. Envío de imagen mejorada directamente como Buffer
    await conn.sendMessage(m.chat, {
      image: upscaledBuffer,
      caption: `✅ *Imagen mejorada con éxito*`
    }, { quoted: m });

    await m.react("✅"); // Reacción de éxito

  } catch (e) {
    console.error(e);
    await m.react("❌");
    return conn.reply(m.chat, `❌ *Error al procesar la imagen:*\n\`\`\`${e.message}\`\`\``, m);
  }
};

handler.help = ['hd', 'upscale'];
handler.tags = ['herramientas'];
handler.command = ['hd', 'upscale', 'mejorarimagen']; 
handler.register = true;
handler.limit = true;

export default handler;

// ─── Funciones internas (Scraper de iLoveIMG) ───

class UpscaleImageAPI {
  constructor() {
    this.api = null;
    this.server = null;
    this.taskId = null;
    this.token = null;
  }

  async getTaskId() {
    try {
      const { data: html } = await axios.get("https://www.iloveimg.com/upscale-image", {
        headers: {
          "Accept": "*/*",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Connection": "keep-alive",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
        },
      });

      const tokenMatches = html.match(/(ey[a-zA-Z0-9?%-_/]+)/g);
      if (!tokenMatches || tokenMatches.length < 2) throw new Error("Token no encontrado en la web.");
      this.token = tokenMatches[1];

      const configMatch = html.match(/var ilovepdfConfig = ({.*?});/s);
      if (!configMatch) throw new Error("Configuración del servidor no encontrada.");
      
      const configJson = JSON.parse(configMatch[1]);
      const servers = configJson.servers;
      if (!Array.isArray(servers) || servers.length === 0) throw new Error("La lista de servidores está vacía.");

      this.server = servers[Math.floor(Math.random() * servers.length)];
      this.taskId = html.match(/ilovepdfConfig\.taskId\s*=\s*['"](\w+)['"]/)?.[1];

      this.api = axios.create({
        baseURL: `https://${this.server}.iloveimg.com`,
        headers: {
          "Accept": "*/*",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Authorization": `Bearer ${this.token}`,
          "Connection": "keep-alive",
          "Origin": "https://www.iloveimg.com",
          "Referer": "https://www.iloveimg.com/",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
        },
      });

      if (!this.taskId) throw new Error("¡No se pudo obtener el ID de la tarea!");
      return { taskId: this.taskId, server: this.server, token: this.token };
    } catch (error) {
      throw new Error(`Fallo al iniciar tarea: ${error.message}`);
    }
  }

  async uploadFromFile(fileBuffer, fileName) {
    if (!this.taskId || !this.api) throw new Error("Primero debes ejecutar getTaskId().");

    try {
      const fileType = await fileTypeFromBuffer(fileBuffer);
      if (!fileType || !fileType.mime.startsWith("image/")) {
        throw new Error("El archivo no es una imagen soportada.");
      }

      const form = new FormData();
      form.append("name", fileName);
      form.append("chunk", "0");
      form.append("chunks", "1");
      form.append("task", this.taskId);
      form.append("preview", "1");
      form.append("pdfinfo", "0");
      form.append("pdfforms", "0");
      form.append("pdfresetforms", "0");
      form.append("v", "web.0");
      form.append("file", fileBuffer, { filename: fileName, contentType: fileType.mime });

      const response = await this.api.post("/v1/upload", form, {
        headers: form.getHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Fallo al subir archivo: ${error.message}`);
    }
  }

  async upscaleImage(serverFilename, scale = 2) {
    if (!this.taskId || !this.api) throw new Error("Primero debes ejecutar getTaskId().");

    try {
      const form = new FormData();
      form.append("task", this.taskId);
      form.append("server_filename", serverFilename);
      form.append("scale", scale.toString());

      const response = await this.api.post("/v1/upscale", form, {
        headers: form.getHeaders(),
        responseType: "arraybuffer", 
      });

      return response.data;
    } catch (error) {
      // Intentamos extraer el error real que envía el servidor en lugar del código 500 genérico
      let detalleError = error.message;
      if (error.response && error.response.data) {
        try {
          detalleError = Buffer.from(error.response.data).toString('utf-8');
        } catch (e) { }
      }
      throw new Error(`Request falló. Detalle del servidor: ${detalleError}`);
    }
  }
}

async function scrapeUpscaleFromFile(fileBuffer, fileName, scale) {
  const upscaler = new UpscaleImageAPI();
  await upscaler.getTaskId();

  const uploadResult = await upscaler.uploadFromFile(fileBuffer, fileName