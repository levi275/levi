import { promises as fs } from 'fs';
import path from 'path';

// --- CONFIGURACIÓN DE RUTAS ---
// Usamos process.cwd() para asegurar que encuentre la ruta sin importar desde donde inicies el bot
const charactersFilePath = path.join(process.cwd(), 'src/database/characters.json');
const haremFilePath = path.join(process.cwd(), 'src/database/harem.json'); // Ajusta si tu harem.json está en otro lado

// --- FUNCIONES AUXILIARES INTERNAS (Para no depender de librerías externas rotas) ---

async function loadJSON(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`[RW-ERROR] No se pudo leer ${filePath}:`, e);
        return [];
    }
}

async function saveJSON(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`[RW-ERROR] No se pudo guardar ${filePath}:`, e);
    }
}

function normalize(s = '') {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function extractNamesFromList(text) {
    const names = [];
    if (!text) return names;
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        if (line.includes('»')) {
            let clean = line.substring(line.indexOf('»') + 1).trim();
            clean = clean.replace(/\s*\(\s*\*?[\d,.]+\*?\s*\)$/, '');
            clean = clean.replace(/\s*\(\s*[\d,.]+\s*\)$/, '');
            clean = clean.replace(/^\*/, '').replace(/\*$/, '').trim();
            if (clean) names.push(clean);
        }
    }
    return [...new Set(names)];
}

// --- HANDLER PRINCIPAL ---

let handler = async (m, { conn, args, participants }) => {
    // 1. Log de depuración: Si esto no sale en la consola, el plugin no se está cargando.
    console.log(`[RW-DEBUG] Comando ejecutado por ${m.sender}`);

    try {
        // --- VALIDACIÓN DE ADMIN ---
        const botOwners = global.owner ? (Array.isArray(global.owner) ? global.owner.map(String) : [String(global.owner)]) : [];
        const isOwner = botOwners.some(id => m.sender.includes(id.replace('@s.whatsapp.net', '')));
        
        let isAdmin = false;
        if (m.isGroup) {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(() => {});
            const participant = groupMetadata?.participants?.find(p => p.id === m.sender);
            isAdmin = !!(participant?.admin) || isOwner;
        } else {
            isAdmin = isOwner; // Si es chat privado, solo owner
        }

        if (!isAdmin) {
            return m.reply('✋ Alto ahí. Solo admins pueden restaurar personajes.');
        }

        // --- CARGAR DATOS ---
        const characters = await loadJSON(charactersFilePath);
        if (!characters.length) return m.reply('✘ Error: characters.json está vacío o no se encuentra.');

        // --- DEFINIR OBJETIVO ---
        let targetJid = m.mentionedJid?.[0];
        if (!targetJid && m.quoted && m.quoted.sender !== conn.user.jid) targetJid = m.quoted.sender;
        if (!targetJid) targetJid = m.sender;

        // --- IDENTIFICAR PERSONAJES ---
        let namesToGive = [];
        
        // Caso 1: Argumento directo (#rwrestaurar Goku)
        if (args.length > 0 && !args[0].startsWith('@')) {
            const query = args.filter(a => !a.startsWith('@')).join(' ');
            if (query) {
                // Buscamos coincidencia exacta o parcial
                const match = characters.find(c => normalize(c.name) === normalize(query)) ||
                              characters.find(c => normalize(c.name).includes(normalize(query)));
                if (match) namesToGive = [match.name];
                else return m.reply(`✘ No encontré al personaje "${query}" en la base de datos.`);
            }
        }
        
        // Caso 2: Responder a lista
        if (namesToGive.length === 0) {
            let sourceText = m.quoted?.text || m.text;
            const extracted = extractNamesFromList(sourceText);
            if (extracted.length > 0) namesToGive = extracted;
        }

        if (namesToGive.length === 0) {
            return m.reply('✘ No detecté personajes. Responde a una lista o escribe el nombre.');
        }

        // --- PROCESAR IDS ---
        const foundChars = [];
        const notFound = [];

        for (const nm of namesToGive) {
            const norm = normalize(nm);
            let ch = characters.find(c => normalize(c.name) === norm);
            if (!ch) ch = characters.find(c => normalize(c.name).includes(norm));
            
            if (ch) foundChars.push(ch);
            else notFound.push(nm);
        }

        if (foundChars.length === 0) return m.reply('✘ Ningún personaje válido encontrado en la base de datos.');

        // --- GUARDAR EN HAREM (Lógica Manual) ---
        const haremData = await loadJSON(haremFilePath); // Cargamos el archivo completo
        const groupId = m.chat;
        
        let addedCount = 0;

        foundChars.forEach(char => {
            // Buscamos si ya existe el claim
            // Estructura usual: { groupId, userId, characterId }
            // Si tu estructura es diferente, ajusta esta parte
            const exists = haremData.some(c => 
                c.groupId === groupId && 
                c.characterId === char.id
            );

            if (exists) {
                // Si existe, lo actualizamos al nuevo dueño
                const index = haremData.findIndex(c => c.groupId === groupId && c.characterId === char.id);
                haremData[index].userId = targetJid;
                addedCount++;
            } else {
                // Si no existe, lo creamos
                haremData.push({
                    groupId: groupId,
                    userId: targetJid,
                    characterId: char.id,
                    claimedAt: new Date().toISOString()
                });
                addedCount++;
            }
        });

        await saveJSON(haremFilePath, haremData);

        // --- RESPONDER ---
        const listStr = foundChars.map(c => `» *${c.name}*`).join('\n');
        let msg = `✅ *RESTAURACIÓN EXITOSA*\n👤 Asignados a: @${targetJid.split('@')[0]}\n📦 Cantidad: ${addedCount}\n\n${listStr}`;
        if (notFound.length) msg += `\n\n⚠ No encontrados: ${notFound.join(', ')}`;

        conn.sendMessage(m.chat, { text: msg, mentions: [targetJid] }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`✘ Error crítico: ${e.message}`);
    }
};

handler.help = ['rwrestaurar'];
handler.tags = ['admin'];
handler.command = /^(rwrestaurar|restaurar|darchars)$/i;
handler.group = true;
// handler.admin = true; // Comentado para manejar el mensaje de error manualmente

export default handler;