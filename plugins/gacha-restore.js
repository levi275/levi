import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  bulkAddClaims
} from '../lib/gacha-group.js';

// Usamos la ruta RELATIVA exacta que usan tus otros comandos funcionales
const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
  try {
    const raw = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo characters.json:', e);
    return [];
  }
}

// Función para normalizar texto (quitar acentos, minúsculas)
function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Función ajustada para LEER tu formato de lista específico
function extractNamesFromList(text) {
  const names = [];
  if (!text) return names;

  const lines = text.split('\n');
  for (const line of lines) {
    // Buscamos líneas con el formato: » *Nombre* (*Valor*)
    if (line.includes('»')) {
      // 1. Tomamos lo que está después de "»"
      let part = line.split('»')[1].trim(); 
      
      // 2. Si tiene paréntesis de valor al final (*123*), lo quitamos
      // Cortamos desde el inicio hasta el último paréntesis abierto
      if (part.includes('(')) {
        part = part.substring(0, part.lastIndexOf('(')).trim();
      }

      // 3. Quitamos asteriscos sobrantes del nombre
      part = part.replace(/\*/g, '').trim();

      if (part) names.push(part);
    }
  }
  return [...new Set(names)]; // Eliminar duplicados
}

let handler = async (m, { conn, args, participants, isROwner }) => {
  try {
    // --- 1. Verificación de Administrador/Dueño ---
    // Usamos una lógica simple compatible con la mayoría de bots
    let isAdmin = false;
    if (m.isGroup) {
      const user = participants.find(p => p.id === m.sender);
      isAdmin = user && (user.admin === 'admin' || user.admin === 'superadmin');
    }
    
    // Si no es admin y no es el dueño del bot (isROwner), rechazamos
    if (!isAdmin && !isROwner) {
      // Solo ignoramos o mandamos mensaje si quieres
      return m.reply('❌ Solo administradores o el dueño pueden usar este comando.');
    }

    // --- 2. Cargar Base de Datos ---
    const characters = await loadCharacters();
    if (!characters || characters.length === 0) {
      return m.reply('❌ Error: No se pudo cargar la base de datos de personajes.');
    }

    // --- 3. Identificar Destinatario (A quién dar los personajes) ---
    let targetJid = m.sender; // Por defecto al que envía el comando

    // Si menciona a alguien: #rwrestaurar @usuario
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetJid = m.mentionedJid[0];
    } 
    // Si responde a un mensaje de otra persona Y no es el bot
    else if (m.quoted && m.quoted.sender && m.quoted.sender !== conn.user.jid) {
      targetJid = m.quoted.sender;
    }

    // --- 4. Obtener Nombres de Personajes ---
    let namesToProcess = [];

    // CASO A: Argumento directo -> #rwrestaurar Goku
    if (args.length > 0 && !args[0].startsWith('@')) {
      const query = args.join(' ').trim();
      // Buscamos coincidencia exacta o parcial
      const char = characters.find(c => normalize(c.name) === normalize(query)) ||
                   characters.find(c => normalize(c.name).includes(normalize(query)));
      
      if (char) namesToProcess.push(char);
      else return m.reply(`⚠️ No encontré el personaje: ${query}`);
    } 
    
    // CASO B: Respondiendo a una lista -> #rwrestaurar (citando lista)
    else {
      let sourceText = '';
      if (m.quoted && m.quoted.text) sourceText = m.quoted.text;
      else if (m.text) sourceText = m.text;

      const extractedNames = extractNamesFromList(sourceText);
      
      if (extractedNames.length === 0) {
        return m.reply('⚠️ No detecté personajes. Responde a una lista con el formato:\n» *Nombre* (*Valor*)');
      }

      // Convertir nombres extraídos a objetos personaje reales
      for (const name of extractedNames) {
        const normName = normalize(name);
        // Búsqueda exacta
        let char = characters.find(c => normalize(c.name) === normName);
        // Búsqueda flexible si falla exacta
        if (!char) {
          char = characters.find(c => normalize(c.name).includes(normName));
        }
        
        if (char) namesToProcess.push(char);
      }
    }

    if (namesToProcess.length === 0) {
      return m.reply('❌ No se encontraron personajes válidos en la base de datos basados en el texto.');
    }

    // --- 5. Guardar en Harem (Restauración) ---
    const groupId = m.chat;
    const harem = await loadHarem();
    
    // Extraemos solo los IDs
    const charIds = namesToProcess.map(c => c.id);

    // Usamos la función bulkAddClaims de tu librería
    const count = bulkAddClaims(harem, groupId, targetJid, charIds);
    
    // ¡IMPORTANTE! Guardar cambios en disco
    await saveHarem(harem);

    // --- 6. Respuesta Exitosa ---
    const listStr = namesToProcess.map(c => `» *${c.name}*`).join('\n');
    
    let msg = `✅ *RESTAURACIÓN COMPLETADA*\n`;
    msg += `👤 *Para:* @${targetJid.split('@')[0]}\n`;
    msg += `📦 *Cantidad:* ${count} Personajes\n\n`;
    msg += listStr;

    await conn.sendMessage(m.chat, { text: msg, mentions: [targetJid] }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply(`❌ Error crítico: ${e.message}`);
  }
};

handler.help = ['rwrestaurar'];
handler.tags = ['owner', 'admin'];
handler.command = ['rwrestaurar', 'restaurar', 'addwaifus']; 
handler.group = true;
handler.admin = true; // Intenta forzar permisos de admin desde el framework del bot

export default handler;