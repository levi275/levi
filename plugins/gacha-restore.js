// Plugin para restaurar o dar personajes a un usuario (sobrescribe propietario actual)
// Uso:
//  - #rwrestaurar <nombre del personaje>           -> da ese personaje al autor
//  - #rwrestaurar <nombre del personaje> @user     -> da ese personaje al usuario mencionado
//  - Responder (#rwrestaurar) a un mensaje que contiene la lista -> da todos los personajes de la lista al usuario
//

import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  addOrUpdateClaim,
  bulkAddClaims
} from '../lib/gacha-group.js';

// Usamos la misma ruta que tu comando funcional para evitar errores de lectura
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

// Normalizador para comparar nombres ignorando acentos y mayúsculas
function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function extractNamesFromList(text) {
  const names = [];
  if (!text) return names;

  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    // Buscamos líneas que contengan "»" y "*"
    // Formato esperado: » *Nombre del Personaje* (*1234*)
    if (line.includes('»')) {
      // 1. Quitar todo lo que esté antes del guion o flecha
      let clean = line.substring(line.indexOf('»') + 1).trim();
      
      // 2. Quitar el valor entre paréntesis al final, ej: (*1234*)
      // Esto elimina desde el último paréntesis de apertura encontrado hasta el final
      clean = clean.replace(/\s*\(\s*\*?[\d,.]+\*?\s*\)$/, ''); 
      clean = clean.replace(/\s*\(\s*[\d,.]+\s*\)$/, ''); // Backup por si no tiene asteriscos dentro

      // 3. Quitar los asteriscos que envuelven el nombre *Nombre*
      clean = clean.replace(/^\*/, '').replace(/\*$/, '').trim();

      if (clean) {
        names.push(clean);
      }
    }
  }
  
  // Retornar nombres únicos para evitar procesar dobles
  return [...new Set(names)];
}

let handler = async (m, { conn, args, participants, text }) => {
  try {
    // --- 1. Verificación de Permisos ---
    const botOwners = Array.isArray(global.owner) ? global.owner : (global.owner ? [global.owner] : []);
    let senderJid = m.sender;
    
    // Fix para LIDs (común en grupos nuevos)
    if (senderJid.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find(p => p.lid === senderJid);
      if (pInfo && pInfo.id) senderJid = pInfo.id;
    }
    
    const senderInfo = participants?.find(p => p.id === senderJid || p.lid === senderJid);
    const isGroupAdmin = !!(senderInfo && (senderInfo.admin || senderInfo.isAdmin || senderInfo.role === 'admin'));
    
    // Convertir todo a string para comparar, por seguridad
    const isOwner = botOwners.some(own => String(own).includes(senderJid.replace('@s.whatsapp.net', '')));

    if (!isOwner && m.isGroup && !isGroupAdmin) {
      return m.reply('✘ Este comando solo lo pueden usar los administradores del grupo o el propietario del bot.');
    }

    // --- 2. Determinar a QUIÉN se le darán los personajes ---
    let targetJid = m.mentionedJid?.[0];
    
    // Si no menciona a nadie, mirar si citó un mensaje, pero CUIDADO:
    // Si cita una lista, queremos los personajes de la lista, pero ¿para quién?
    // Lógica: 
    // - Si menciona @usuario -> para @usuario
    // - Si responde a un mensaje de otro usuario (y no es el propio bot enviando la lista) -> para el usuario del mensaje citado
    // - Si no hay mención ni usuario citado claro -> para quien ejecuta el comando
    
    if (!targetJid && m.quoted && m.quoted.sender && m.quoted.sender !== conn.user.jid) {
       targetJid = m.quoted.sender;
    }
    
    // Fix LIDs para target
    if (targetJid && targetJid.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find(p => p.lid === targetJid);
      if (pInfo && pInfo.id) targetJid = pInfo.id;
    }
    
    if (!targetJid) targetJid = senderJid; // Por defecto al que ejecuta el comando

    // --- 3. Obtener Nombres ---
    const characters = await loadCharacters();
    if (!characters.length) return m.reply('✘ Error crítico: No se cargó la base de datos (characters.json).');

    let namesToGive = [];

    // CASO A: Argumentos directos (ej: #rwrestaurar Goku)
    if (args && args.length > 0 && !args[0].startsWith('@')) { // Ignoramos si el primer arg es una mención
      // Reconstruimos el nombre quitando menciones si las hay al final
      const textWithoutMentions = args.filter(a => !a.startsWith('@')).join(' ');
      if (textWithoutMentions) {
         // Buscamos match directo
         const candidate = characters.find(c => normalize(c.name) === normalize(textWithoutMentions)) ||
                           characters.find(c => normalize(c.name).includes(normalize(textWithoutMentions)));
         
         if (candidate) namesToGive = [candidate.name];
         else return m.reply(`✘ No encontré ningún personaje llamado: ${textWithoutMentions}`);
      }
    }

    // CASO B: Respondiendo a una lista (Si namesToGive sigue vacío)
    if (namesToGive.length === 0) {
      let sourceText = '';
      if (m.quoted && m.quoted.text) sourceText = m.quoted.text;
      else if (m.text) sourceText = m.text; // (Poco probable que funcione sin citar, pero se deja)

      const extracted = extractNamesFromList(sourceText);
      if (extracted.length > 0) {
        namesToGive = extracted;
      } else {
        // Si llegamos aquí y no hay argumentos ni lista válida
        return m.reply('✘ No detecté personajes.\n\nUso:\n1. Responde a una lista de harem con #rwrestaurar\n2. O escribe #rwrestaurar <Nombre Personaje>');
      }
    }

    // --- 4. Procesar y Asignar ---
    const groupId = m.chat;
    const foundChars = [];
    const notFound = [];

    for (const nm of namesToGive) {
      const norm = normalize(nm);
      // Intentar búsqueda exacta primero
      let ch = characters.find(c => normalize(c.name) === norm);
      
      // Si falla, búsqueda flexible (contiene)
      if (!ch) {
        ch = characters.find(c => normalize(c.name).includes(norm) || norm.includes(normalize(c.name)));
      }

      if (ch) foundChars.push(ch);
      else notFound.push(nm);
    }

    if (foundChars.length === 0) {
      return m.reply(`✘ No pude identificar ningún personaje en la base de datos.\nNombres intentados: ${notFound.join(', ')}`);
    }

    // Guardar en Harem
    const harem = await loadHarem();
    const charIds = foundChars.map(c => c.id);
    
    // Función de tu librería para añadir en masa
    const addedCount = bulkAddClaims(harem, groupId, targetJid, charIds);
    await saveHarem(harem);

    // --- 5. Respuesta Final ---
    const givenList = foundChars.map(c => `» *${c.name}* (*${c.value || '?'}*)`).join('\n');
    let replyMsg = `✔ *RESTAURACIÓN COMPLETADA*\n\n👤 *Usuario:* @${targetJid.split('@')[0]}\najustados *${addedCount}* personajes al inventario:\n\n${givenList}`;
    
    if (notFound.length > 0) {
      replyMsg += `\n\n⚠ *No encontrados en DB:* ${notFound.join(', ')}`;
    }

    await conn.sendMessage(m.chat, { text: replyMsg, mentions: [targetJid] }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply(`✘ Ocurrió un error inesperado: ${e.message}`);
  }
};

handler.help = ['rwrestaurar <nombre> | responder a lista'];
handler.tags = ['waifus', 'admin'];
handler.command = ['rwrestaurar', 'restaurar']; // Agregué un alias por si acaso
handler.group = true;
handler.admin = true; // Forzamos flag de admin por si el check manual falla en algunos frameworks

export default handler;