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
  } catch (err) {
    console.error('[gacha-restore] error loading characters.json:', err && err.message);
    return [];
  }
}

function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function extractNamesFromList(text) {
  const names = [];
  if (!text) return names;
  const regexStar = /»\s*\*([^*]+)\*/g;
  let m;
  while ((m = regexStar.exec(text)) !== null) {
    names.push(m[1].trim());
  }
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
  return [...new Set(names)];
}

let handler = async (m, { conn, args, participants, text, isOwner, isAdmin, isROwner }) => {
  try {
    console.log('[gacha-restore] handler invoked by', m.sender);
    // Permisos: owner o admin de grupo
    const botOwners = Array.isArray(global.owner) ? global.owner : (global.owner ? [global.owner] : []);
    let senderJid = m.sender;
    if (senderJid.endsWith('@lid') && m.isGroup) {
      const pInfo = participants?.find(p => p.lid === senderJid);
      if (pInfo && pInfo.id) senderJid = pInfo.id;
    }
    const senderInfo = participants?.find(p => p.id === senderJid || p.lid === senderJid);
    const isGroupAdmin = !!(senderInfo && (senderInfo.admin || senderInfo.isAdmin || senderInfo.role === 'admin'));

    const isOwnerResolved = isOwner || isROwner || botOwners.includes(m.sender) || botOwners.includes(senderJid);

    if (!isOwnerResolved && m.isGroup && !isGroupAdmin) {
      return m.reply('✘ Este comando solo lo pueden usar los administradores del grupo o el propietario del bot.');
    }

    // Determinar target
    let targetJid = m.mentionedJid?.[0];
    if (targetJid && targetJid.endsWith('@lid') && m.isGroup) {
      const pInfo = participants?.find(p => p.lid === targetJid);
      if (pInfo && pInfo.id) targetJid = pInfo.id;
    }
    if (!targetJid && m.quoted && m.quoted.sender) {
      targetJid = m.quoted.sender;
      if (targetJid.endsWith('@lid') && m.isGroup) {
        const pInfo = participants?.find(p => p.lid === targetJid);
        if (pInfo && pInfo.id) targetJid = pInfo.id;
      }
    }
    if (!targetJid) targetJid = senderJid;

    const groupId = m.chat;
    const characters = await loadCharacters();
    if (!characters.length) return m.reply('✘ No hay datos de personajes disponibles en characters.json.');

    let namesToGive = [];

    if (args && args.length > 0) {
      const nameQuery = args.join(' ').trim();
      const normQuery = normalize(nameQuery);
      const candidate = characters.find(c => normalize(c.name) === normQuery) ||
                        characters.find(c => normalize(c.name).includes(normQuery)) ||
                        characters.find(c => String(c.id).toLowerCase() === normQuery);
      if (!candidate) return m.reply(`✘ No se encontró el personaje: ${nameQuery}`);
      namesToGive = [candidate.name];
    } else {
      let sourceText = '';
      if (m.quoted && m.quoted.text) sourceText = m.quoted.text;
      else if (m.text) sourceText = m.text;
      const commandRemoved = sourceText.replace(/^\s*#?rwrestaurar\b/i, '').trim();
      const extracted = extractNamesFromList(commandRemoved || sourceText);
      if (extracted.length) namesToGive = extracted;
      else return m.reply('✘ No encontré nombres de personajes en el mensaje. Usa: #rwrestaurar <nombre> o responde a un mensaje con la lista.');
    }

    // Buscar personajes
    const foundChars = [];
    const notFound = [];
    for (const nm of namesToGive) {
      const norm = normalize(nm);
      let ch = characters.find(c => normalize(c.name) === norm || String(c.id).toLowerCase() === norm);
      if (!ch) ch = characters.find(c => normalize(c.name).includes(norm) || norm.includes(normalize(c.name)));
      if (ch) foundChars.push(ch);
      else notFound.push(nm);
    }
    if (foundChars.length === 0) return m.reply(`✘ Ningún personaje válido encontrado. No encontrados: ${notFound.join(', ')}`);

    const harem = await loadHarem();
    const charIds = foundChars.map(c => c.id);
    // bulkAddClaims puede ser async: await por seguridad
    const added = await bulkAddClaims(harem, groupId, targetJid, charIds);
    await saveHarem(harem);

    const givenList = foundChars.map(c => `» *${c.name}* (*${c.value || 'Desconocido'}*)`).join('\n');
    let reply = `✔ Se han asignado ${added || foundChars.length} personaje(s) a ${targetJid} en este grupo:\n\n${givenList}`;
    if (notFound.length) reply += `\n\n✘ No encontrados: ${notFound.join(', ')}`;

    try {
      await conn.sendMessage(m.chat, { text: reply, mentions: [targetJid] }, { quoted: m });
    } catch {
      m.reply(reply);
    }
  } catch (e) {
    console.error('[gacha-restore] error:', e);
    m.reply(`✘ Error al ejecutar #rwrestaurar: ${e?.message || e}`);
  }
};

handler.help = ['rwrestaurar <nombre> | reply'];
handler.tags = ['waifus'];
// añadimos aliases (incluido 'dsr') por si quieres invocar con otro nombre
handler.command = ['rwrestaurar', 'recuperar', 'dsr', 'dsrpersonajes'];
handler.group = true;
export default handler;