import { chromium } from "playwright";

// --- FUNCIÓN SCRAPER DIRECTA (Sin depender de APIs) ---
async function mediafireScrape(url) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      extraHTTPHeaders: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const page = await context.newPage();

    await page.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    try {
      await page.goto(url, { timeout: 60000, waitUntil: "networkidle" });
    } catch (navError) {
      console.log("Navigation issue, trying alternative approach...");
    }

    await page.waitForTimeout(3000);

    try {
      const popupSelectors = [".close-btn", ".modal-close", '[data-dismiss="modal"]', ".popup-close"];
      for (const selector of popupSelectors) {
        const popup = await page.$(selector);
        if (popup) {
          await popup.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (e) {}

    const fileInfo = await page.evaluate(() => {
      const getFileName = () => {
        const selectors = [".filename", ".dl-filename", "h1.filename", ".file-title", ".file_name", ".dl-file-name"];
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) return element.textContent.trim();
        }
        const title = document.title;
        if (title && title.includes(" - ")) return title.split(" - ")[0].trim();
        return "Unknown";
      };

      const getFileSize = () => {
        const selectors = [".details > li:first-child > span", ".file_size", ".dl-info > div:first-child", ".file-size", ".size"];
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) return element.textContent.trim();
        }
        const downloadBtn = document.querySelector("#downloadButton");
        if (downloadBtn && downloadBtn.textContent) {
          const sizeMatch = downloadBtn.textContent.match(/\((\d+\.?\d*\s*[KMGT]?B)\)/i);
          if (sizeMatch) return sizeMatch[1];
        }
        const allText = document.body.innerText;
        const sizeMatch = allText.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
        if (sizeMatch) return sizeMatch[0];
        return "Unknown";
      };

      const getDescription = () => {
        const element = document.querySelector(".description p:not(.description-subheading)");
        return element ? element.textContent?.trim() || "" : "";
      };

      const getUploadDate = () => {
        const uploadElement = Array.from(document.querySelectorAll(".details li")).find((li) => li.textContent?.includes("Uploaded"));
        return uploadElement?.querySelector("span")?.textContent?.trim() || "";
      };

      const getFileType = () => {
        const element = document.querySelector(".filetype span:first-child");
        return element ? element.textContent?.trim() || "" : "";
      };

      const getCompatibility = () => {
        const compatSelect = document.getElementById("compat-select");
        if (compatSelect) {
          const selectedOption = compatSelect.options[compatSelect.selectedIndex];
          return selectedOption ? selectedOption.textContent?.trim() || "" : "";
        }
        return "";
      };

      const getDownloadLink = () => {
        const downloadBtn = document.querySelector("#downloadButton, a.input.popsok, a[data-scrambled-url]");
        if (downloadBtn && downloadBtn.getAttribute("data-scrambled-url")) {
          try {
            const scrambledUrl = downloadBtn.getAttribute("data-scrambled-url");
            return atob(scrambledUrl);
          } catch (e) {
            console.log("Failed to decode scrambled URL:", e);
          }
        }
        const selectors = ["#downloadButton", "a.input.popsok", ".download_file_link", "a.gbtnprimary", 'a[href*="download"]', 'a[aria-label*="Download"]'];
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.href && !element.href.includes("javascript:")) {
            let href = element.href;
            if (href.startsWith("//")) href = "https:" + href;
            else if (href.startsWith("/")) href = window.location.origin + href;
            return href;
          }
        }
        return null;
      };

      return {
        name: getFileName(),
        size: getFileSize(),
        description: getDescription(),
        uploadDate: getUploadDate(),
        fileType: getFileType(),
        compatibility: getCompatibility(),
        link: getDownloadLink(),
      };
    });

    if (!fileInfo.link) {
      try {
        await page.waitForSelector("#downloadButton", { timeout: 10000 });
        await page.click("#downloadButton");
        await page.waitForFunction(() => {
          const btn = document.querySelector("#downloadButton");
          return btn && btn.getAttribute("data-scrambled-url");
        }, { timeout: 15000 });

        const scrambledLink = await page.evaluate(() => {
          const downloadBtn = document.querySelector("#downloadButton");
          if (downloadBtn && downloadBtn.getAttribute("data-scrambled-url")) {
            try { return atob(downloadBtn.getAttribute("data-scrambled-url")); } catch (e) { return null; }
          }
          return null;
        });

        if (scrambledLink) fileInfo.link = scrambledLink;
      } catch (e) {
        let interceptedUrl = null;
        page.on('request', (request) => {
          const reqUrl = request.url();
          if (reqUrl.includes('mediafire.com') && (reqUrl.includes('download') || reqUrl.match(/\.(zip|rar|exe|apk|pdf|mp4|mp3)$/i))) {
            interceptedUrl = reqUrl;
          }
        });
        try {
          await page.click("#downloadButton");
          await page.waitForTimeout(5000);
          if (interceptedUrl) fileInfo.link = interceptedUrl;
        } catch (clickError) {}
      }
    }

    const fileExtensionMatch = fileInfo.name?.match(/\.([a-zA-Z0-9]+)$/);
    const fileExtension = fileExtensionMatch ? fileExtensionMatch[1].toLowerCase() : "";

    const mimeTypeMap = {
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      txt: "text/plain",
      exe: "application/x-msdownload",
      apk: "application/vnd.android.package-archive",
    };

    const mimeType = mimeTypeMap[fileExtension] || "application/octet-stream";
    await browser.close();

    return {
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      downloadLink: fileInfo.link,
      mimeType,
    };
  } catch (error) {
    if (browser) await browser.close();
    throw new Error(`Fallo al extraer: ${error.message}`);
  }
}

// --- COMANDO DEL BOT ---
const handler = async (m, { conn, args }) => {
    if (!args[0]) throw '📎 *Por favor, proporciona un enlace válido de MediaFire o el código del archivo.*\n\nEjemplos:\n`.mf https://www.mediafire.com/file/xxxxxx/archivo.apk/file`\n`.mf xxxxxx`';

    let input = args[0];
    let finalUrl = '';

    // Soporte para URL o solo código
    if (input.includes('mediafire.com')) {
        finalUrl = input;
    } else if (/^[a-zA-Z0-9]+$/.test(input)) {
        finalUrl = `https://www.mediafire.com/file/${input}`; 
    } else {
        throw '❌ *El enlace o código proporcionado no es válido.*';
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        // En vez de usar fetch a la API caída, usamos tu scraper directamente
        let data = await mediafireScrape(finalUrl);

        if (!data || !data.downloadLink) {
            throw '⚠️ *No se encontró el enlace directo de descarga. Puede que el archivo esté eliminado o sea privado.*';
        }

        let { fileName, fileSize, mimeType, downloadLink } = data;

        await conn.sendMessage(
            m.chat,
            {
                document: { url: downloadLink },
                mimetype: mimeType,
                fileName: fileName,
                caption: `📂 *Nombre:* ${fileName}\n📦 *Tamaño:* ${fileSize}`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("Error en MediaFire:", err);
        throw '❌ *Ocurrió un error al procesar tu solicitud.*';
    }
};

handler.command = ['mf', 'mediafire'];
handler.help = ['mediafire <url | código>'];
handler.tags = ['descargas'];

export default handler;