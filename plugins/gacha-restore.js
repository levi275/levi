// Plugin para restaurar o dar personajes a un usuario (sobrescribe propietario actual)
// Uso:
//  - #rwrestaurar <nombre del personaje>           -> da ese personaje al autor
//  - #rwrestaurar <nombre del personaje> @user     -> da ese personaje al usuario mencionado
//  - Responder (#rwrestaurar) a un mensaje que contiene la lista que muestras -> dará todas las entradas encontradas al usuario mencionado/en respuesta o al emisor
//
// Requiere permisos: propietario del bot o admin de grupo (puedes ajustar).
import { promises as fs } from 'fs';
import path from 'path';
import {
  loadHarem,
  saveHarem,
  addOrUpdateClaim,
  bulkAddClaims
} from '../lib/gacha-group.js';

const charactersFilePath = path.join(process.cwd(), 'src', 'database', 'characters.json');

async function loadCharacters() {
  try {
    const raw = await fs.readFile(charactersFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function extractNamesFromList(text) {
  // Intenta extraer entradas del tipo:
  // » *Name* (*12345*)
  // o líneas con el nombre entre *...*
  const names = [];
  if (!text) return names;
  const regexStar = /»\s*\*([^*]+)\*/g;
  let m;
  while ((m = regexStar.exec(text)) !== null) {
    names.push(m[1].trim());
  }
  // fallback: buscar líneas que empiecen con » o guion y tomar parte antes del paréntesis
  if (names.length === 0) {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^[»\-\>\s]*\*?([^(*\n\r]+)\*?\s*(?:\(|$)/);
      if (match && match[1]) {
        const nm = match[1].trim();
        if (nm) names.push(nm);
      }
    }
  }
  // unique
  return [...new Set(names)];
}

let handler = async (m, { conn, args, participants, text }) => {
  try {
    // Permisos: propietario del bot o admin de grupo
    const botOwners = Array.isArray(global.owner) ? global.owner : (global.owner ? [global.owner] : []);
    // resolver sender id estándar (lid mapping)
    let senderJid = m.sender;
    if (senderJid.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find(p => p.lid === senderJid);
      if (pInfo && pInfo.id) senderJid = pInfo.id;
    }
    const senderInfo = participants?.find(p => p.id === senderJid || p.lid === senderJid);
    const isGroupAdmin = !!(senderInfo && (senderInfo.admin || senderInfo.isAdmin || senderInfo.role === 'admin'));

    const isOwner = botOwners.includes(m.sender) || botOwners.includes(senderJid);

    if (!isOwner && m.isGroup && !isGroupAdmin) {
      return m.reply('✘ Este comando solo lo pueden usar los administradores del grupo o el propietario del bot.');
    }

    // determinar usuario objetivo: m.mentionedJid[0] o citado o el autor si no hay
    let targetJid = m.mentionedJid?.[0];
    if (targetJid && targetJid.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find(p => p.lid === targetJid);
      if (pInfo && pInfo.id) targetJid = pInfo.id;
    }
    if (!targetJid && m.quoted && m.quoted.sender) {
      targetJid = m.quoted.sender;
      if (targetJid.endsWith('@lid') && m.isGroup) {
        const pInfo = participants.find(p => p.lid === targetJid);
        if (pInfo && pInfo.id) targetJid = pInfo.id;
      }
    }
    if (!targetJid) targetJid = senderJid;

    const groupId = m.chat;
    const characters = await loadCharacters();
    if (!characters.length) return m.reply('✘ No hay datos de personajes disponibles en characters.json.');

    // modos:
    // 1) args present -> tratar como nombre (posible nombre compuesto)
    // 2) si no args y la persona respondió a un mensaje -> parsear la lista en el mensaje citado o el texto del mensaje mencionado
    // 3) si el texto del mensaje contiene muchas líneas -> parsear
    let namesToGive = [];

    if (args && args.length > 0) {
      const nameQuery = args.join(' ').trim();
      // busco coincidencia exacta (ignorando mayúsculas) o contains
      const candidate = characters.find(c => normalize(c.name) === normalize(nameQuery)) ||
                        characters.find(c => normalize(c.name).includes(normalize(nameQuery))) ||
                        characters.find(c => normalize(c.id) === normalize(nameQuery));
      if (!candidate) return m.reply(`✘ No se encontró el personaje: ${nameQuery}`);
      namesToGive = [candidate.name];
    } else {
      // intentar extraer del texto citado o del propio texto del comando
      let sourceText = '';
      if (m.quoted && m.quoted.text) sourceText = m.quoted.text;
      else if (m.text) sourceText = m.text;
      // quitar el comando inicial si está en el mismo mensaje
      const commandRemoved = sourceText.replace(/^\s*#?rwrestaurar\b/i, '').trim();
      const extracted = extractNamesFromList(commandRemoved || sourceText);
      if (extracted.length) {
        namesToGive = extracted;
      } else {
        return m.reply('✘ No encontré nombres de personajes en el mensaje. Usa: #rwrestaurar <nombre> o responde a un mensaje con la lista.');
      }
    }

    // convertir nombres a ids; si no hay match exacto usar búsqueda por inclusión y reportar los no encontrados
    const foundChars = [];
    const notFound = [];
    for (const nm of namesToGive) {
      const norm = normalize(nm);
      let ch = characters.find(c => normalize(c.name) === norm || String(c.id).toLowerCase() === norm);
      if (!ch) {
        // búsqueda por inclusión - tomar el mejor candidato (primer match)
        ch = characters.find(c => normalize(c.name).includes(norm) || norm.includes(normalize(c.name)));
      }
      if (ch) foundChars.push(ch);
      else notFound.push(nm);
    }

    if (foundChars.length === 0) {
      return m.reply(`✘ Ningún personaje válido encontrado. No encontrados: ${notFound.join(', ')}`);
    }

    // cargar harem y aplicar cambios
    const harem = await loadHarem();
    const charIds = foundChars.map(c => c.id);
    const added = bulkAddClaims(harem, groupId, targetJid, charIds);
    await saveHarem(harem);

    const givenList = foundChars.map(c => `» *${c.name}* (*${c.value || 'Desconocido'}*)`).join('\n');
    let reply = `✔ Se han asignado ${added} personaje(s) a ${targetJid} en este grupo:\n\n${givenList}`;
    if (notFound.length) reply += `\n\n✘ No encontrados: ${notFound.join(', ')}`;

    // intenta mencionar si el target es visible
    try {
      await conn.sendMessage(m.chat, { text: reply, mentions: [targetJid] }, { quoted: m });
    } catch {
      m.reply(reply);
    }
  } catch (e) {
    console.error(e);
    m.reply(`✘ Error al ejecutar #rwrestaurar: ${e.message}`);
  }
};

handler.help = ['rwrestaurar <nombre> | reply'];
handler.tags = ['waifus'];
handler.command = ['rwrestaurar'];
handler.group = true;

export default handler;
