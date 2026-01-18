import { promises as fs } from 'fs';
// IMPORTANTE: Asegúrate de que este archivo existe en tu carpeta 'lib'.
// Si tu carpeta de plugins está dentro de 'src', quizás la ruta deba ser '../../lib/gacha-group.js'
import {
  loadHarem,
  saveHarem,
  addOrUpdateClaim,
  bulkAddClaims
} from '../lib/gacha-group.js'; 

const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
  try {
    const raw = await fs.readFile(charactersFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error cargando characters.json:', e);
    return [];
  }
}

function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function extractNamesFromList(text) {
  const names = [];
  if (!text) return names;
  // Regex para capturar nombres entre asteriscos después de una flecha o similar
  const regexStar = /»\s*\*([^*]+)\*/g;
  let m;
  while ((m = regexStar.exec(text)) !== null) {
    names.push(m[1].trim());
  }
  
  if (names.length === 0) {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      // Intenta capturar lo que está antes del paréntesis
      const match = line.match(/^[»\-\>\s]*\*?([^(*\n\r]+)\*?\s*(?:\(|$)/);
      if (match && match[1]) {
        const nm = match[1].trim();
        if (nm) names.push(nm);
      }
    }
  }
  return [...new Set(names)];
}

let handler = async (m, { conn, args, participants, text, isROwner, isOwner, isAdmin }) => {
  try {
    // 1. Verificación de permisos (Usando variables estándar del bot si están disponibles)
    // Si isOwner/isAdmin no vienen definidos por el main, hacemos chequeo manual:
    const userIsOwner = isOwner || isROwner || (global.owner || []).some(o => m.sender.includes(o));
    
    // Si no es admin ni owner, rechazamos (excepto si es chat privado, que no hay admins)
    if (!userIsOwner && m.isGroup && !isAdmin) {
       // Check manual de admin si la variable isAdmin falló
       const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat) : {};
       const participants = m.isGroup ? groupMetadata.participants : [];
       const user = participants.find(u => u.id === m.sender);
       const isUserAdmin = user?.admin === 'admin' || user?.admin === 'superadmin';
       
       if (!isUserAdmin) {
         return m.reply('✘ Este comando solo lo pueden usar los administradores del grupo o el propietario del bot.');
       }
    }

    // 2. Determinar a quién se le da el personaje
    let targetJid = m.sender;
    if (m.mentionedJid && m.mentionedJid[0]) {
      targetJid = m.mentionedJid[0];
    } else if (m.quoted && m.quoted.sender) {
      targetJid = m.quoted.sender;
    }

    const groupId = m.chat;
    const characters = await loadCharacters();
    if (!characters.length) return m.reply('✘ No se pudo cargar la base de datos de personajes (characters.json).');

    // 3. Obtener nombres
    let namesToGive = [];

    if (args && args.length > 0) {
      // Caso 1: Nombre escrito en el comando
      const nameQuery = args.join(' ').trim();
      const normQuery = normalize(nameQuery);
      
      const candidate = characters.find(c => normalize(c.name) === normQuery) ||
                        characters.find(c => normalize(c.name).includes(normQuery)) ||
                        characters.find(c => normalize(c.id) === normQuery);
                        
      if (!candidate) return m.reply(`✘ No se encontró el personaje: ${nameQuery}`);
      namesToGive = [candidate.name];
    } else {
      // Caso 2: Responder a lista o leer mensaje citado
      let sourceText = '';
      if (m.quoted && m.quoted.text) sourceText = m.quoted.text;
      else if (m.text) sourceText = m.text;
      
      // Limpiamos el comando del texto
      const commandRemoved = sourceText.replace(/^\s*#?rwrestaurar\b/i, '').trim();
      const extracted = extractNamesFromList(commandRemoved || sourceText);
      
      if (extracted.length) {
        namesToGive = extracted;
      } else {
        return m.reply('✘ No encontré nombres válidos. Uso:\n- #rwrestaurar <nombre>\n- Responder a una lista con #rwrestaurar');
      }
    }

    // 4. Procesar y asignar
    const foundChars = [];
    const notFound = [];

    for (const nm of namesToGive) {
      const norm = normalize(nm);
      // Búsqueda exacta primero, luego parcial
      let ch = characters.find(c => normalize(c.name) === norm || String(c.id).toLowerCase() === norm);
      if (!ch) {
        ch = characters.find(c => normalize(c.name).includes(norm));
      }
      
      if (ch) foundChars.push(ch);
      else notFound.push(nm);
    }

    if (foundChars.length === 0) {
      return m.reply(`✘ Ningún personaje válido encontrado. No encontrados: ${notFound.join(', ')}`);
    }

    // Cargar harem y guardar
    const harem = await loadHarem();
    const charIds = foundChars.map(c => c.id);
    
    // Aseguramos que targetJid sea string limpio
    const cleanTarget = targetJid.split('@')[0] + '@s.whatsapp.net';
    
    const added = await bulkAddClaims(harem, groupId, cleanTarget, charIds); // Asumiendo que puede ser async
    await saveHarem(harem);

    // Respuesta
    const givenList = foundChars.map(c => `» *${c.name}*`).join('\n');
    let reply = `✔ Se han asignado ${added} personaje(s) a @${cleanTarget.split('@')[0]}:\n\n${givenList}`;
    if (notFound.length) reply += `\n\n✘ Ignorados: ${notFound.join(', ')}`;

    await conn.sendMessage(m.chat, { text: reply, mentions: [cleanTarget] }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply(`✘ Error crítico: ${e.message}`);
  }
};

handler.help = ['rwrestaurar <nombre>'];
handler.tags = ['waifus'];
handler.command = ['rwrestaurar', 'recuperar']; 
handler.group = true;
handler.admin = true; // Intenta forzar admin desde el handler del bot
handler.rowner = true; // Opcional: permite al owner usarlo sin ser admin

export default handler;