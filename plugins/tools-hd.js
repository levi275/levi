import axios from "axios";
import FormData from "form-data";
import { fileTypeFromBuffer } from "file-type";
import crypto from "crypto";

const ILOVEIMG_PAGE_URL = "https://www.iloveimg.com/upscale-image";

const findFirstMatch = (content, patterns) => {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const parseServers = (rawServers) => {
  if (!rawServers) return [];

  if (Array.isArray(rawServers)) return rawServers.filter(Boolean);

  if (typeof rawServers === "string") {
    return rawServers
      .split(",")
      .map((s) => s.trim().replaceAll('"', "").replaceAll("'", ""))
      .filter(Boolean);
  }

  return [];
};

const handler = async (m, { conn }) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || "";

  if (!mime || !/image\/(png|jpe?g|webp)/i.test(mime)) {
    return conn.reply(m.chat, "❌ Responde a una imagen válida (png, jpg o webp).", m);
  }

  await m.react("⏳");

  try {
    const media = await q.download();
    if (!media) throw new Error("No se pudo descargar la imagen.");

    await conn.reply(m.chat, "✨ *Procesando tu imagen en HD...* (puede tardar unos segundos)", m);

    const randomName = `image_${crypto.randomBytes(3).toString("hex")}.jpg`;
    const upscaledBuffer = await scrapeUpscaleFromFile(media, randomName, 2);

    await conn.sendMessage(
      m.chat,
      {
        image: upscaledBuffer,
        caption: "✅ *Imagen mejorada con éxito*",
      },
      { quoted: m },
    );

    await m.react("✅");
  } catch (error) {
    console.error("[tools-hd] Error:", error);
    await m.react("❌");
    return conn.reply(
      m.chat,
      `❌ *Error al procesar la imagen:*\n\
\`\`\`${error?.message || "Error desconocido"}\`\`\``,
      m,
    );
  }
};

handler.help = ["hd", "upscale"];
handler.tags = ["herramientas"];
handler.command = ["hd", "upscale", "mejorarimagen"];
handler.register = true;
handler.limit = true;

export default handler;

class UpscaleImageAPI {
  constructor() {
    this.api = null;
    this.server = null;
    this.taskId = null;
    this.token = null;
  }

  async getTaskId() {
    try {
      const { data: html } = await axios.get(ILOVEIMG_PAGE_URL, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        },
        timeout: 20000,
      });

      this.token = findFirstMatch(html, [
        /"token":"([^"]+)"/,
        /token\s*[:=]\s*["']([^"']+)["']/,
        /(ey[a-zA-Z0-9?%\-_/]+)/,
      ]);

      this.taskId = findFirstMatch(html, [
        /"taskId":"([^"]+)"/,
        /taskId\s*[:=]\s*["']([^"']+)["']/,
        /ilovepdfConfig\.taskId\s*=\s*["']([^"']+)["']/, // fallback viejo
      ]);

      const serversRaw = findFirstMatch(html, [
        /"servers":\[([^\]]+)\]/,
        /servers\s*[:=]\s*\[([^\]]+)\]/,
      ]);

      const servers = parseServers(serversRaw);

      if (!this.token) throw new Error("Token no encontrado.");
      if (!this.taskId) throw new Error("Task ID no encontrado.");

      if (!servers.length) throw new Error("Lista de servidores vacía.");
      this.server = servers[Math.floor(Math.random() * servers.length)];

      this.api = axios.create({
        baseURL: `https://${this.server}.iloveimg.com`,
        headers: {
          Accept: "application/json, text/plain, */*",
          Authorization: `Bearer ${this.token}`,
          Origin: "https://www.iloveimg.com",
          Referer: "https://www.iloveimg.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        },
        timeout: 30000,
      });

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
        headers: { ...form.getHeaders() },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Fallo al subir archivo: ${error.message}`);
    }
  }

  async upscaleImage(serverFilename, scale = 2) {
    if (!this.taskId || !this.api) throw new Error("Primero debes ejecutar getTaskId().");
    if (![2, 4].includes(scale)) throw new Error("El parámetro scale debe ser 2 o 4.");

    try {
      const form = new FormData();
      form.append("task", this.taskId);
      form.append("server_filename", serverFilename);
      form.append("scale", String(scale));

      await this.api.post("/v1/upscale", form, {
        headers: { ...form.getHeaders() },
      });
    } catch (error) {
      const detalle =
        error?.response?.data && Buffer.isBuffer(error.response.data)
          ? error.response.data.toString("utf-8")
          : error?.response?.data
            ? JSON.stringify(error.response.data)
            : error.message;

      throw new Error(`Fallo al aplicar el Upscale: ${detalle}`);
    }
  }

  async downloadResult() {
    if (!this.taskId || !this.api) throw new Error("Primero debes ejecutar getTaskId().");

    try {
      const response = await this.api.get(`/v1/download/${this.taskId}`, {
        responseType: "arraybuffer",
      });

      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Fallo al descargar resultado: ${error.message}`);
    }
  }
}

async function scrapeUpscaleFromFile(fileBuffer, fileName, scale = 2) {
  const upscaler = new UpscaleImageAPI();
  await upscaler.getTaskId();

  const uploadResult = await upscaler.uploadFromFile(fileBuffer, fileName);
  if (!uploadResult?.server_filename) {
    throw new Error("No se pudo subir la imagen a iLoveIMG.");
  }

  await upscaler.upscaleImage(uploadResult.server_filename, scale);
  const imageBuffer = await upscaler.downloadResult();

  const outType = await fileTypeFromBuffer(imageBuffer);
  if (!outType?.mime?.startsWith("image/")) {
    throw new Error("iLoveIMG no devolvió una imagen válida.");
  }

  return imageBuffer;
}
