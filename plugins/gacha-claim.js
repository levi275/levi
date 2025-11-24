import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';
const claimMsgFile = './src/database/userClaimConfig.json';
export const cooldowns = {};

async function loadCharacters() {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
}

async function saveCharacters(characters) {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
}

async function loadClaimMessages() {
    try {
        const data = await fs.readFile(claimMsgFile, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function getCustomClaimMessage(userId, username, characterName) {
    const messages = await loadClaimMessages();
    const template = messages[userId] || '✧ *$user* ha reclamado a *$character* ✦';
    return template.replace(/\$user/g, username).replace(/\$character/g, characterName);
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = cooldowns[userId] - now;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return conn.reply(m.chat, `⏳ Debes esperar *${minutes}m ${seconds}s* antes de reclamar otra waifu.`, m);
    }

    if (!m.quoted || !m.quoted.text) {
        return conn.reply(m.chat, '《✧》Debes *citar un personaje válido* para reclamarlo.', m);
    }

    try {
        const characters = await loadCharacters();
        const match = m.quoted.text.match(/𝙄𝘿:\s*\*([^\*]+)\*/i);
        if (!match) return conn.reply(m.chat, '《✧》No se pudo detectar el ID del personaje.', m);

        const id = match[1].trim();
        const character = characters.find(c => c.id === id);

        if (!character) return conn.reply(m.chat, '《✧》Personaje no encontrado.', m);

        const rollData = global.activeRolls ? global.activeRolls[id] : null;
        
        if (rollData) {
            const timeElapsed = now - rollData.time;

            if (timeElapsed > 40000) {
                delete global.activeRolls[id];
                return conn.reply(m.chat, "ese personaje ya expiró y nadie puede reclamarlo", m);
            }

            if (timeElapsed < 20000 && rollData.user !== userId) {
                const protectedBy = await conn.getName(rollData.user);
                return conn.reply(m.chat, `el personaje ${character.name} está siendo protegido por ${protectedBy} por 20 segundos`, m);
            }
        } else {
            if (!character.user) {
                return conn.reply(m.chat, "ese personaje ya expiró y nadie puede reclamarlo", m);
            }
        }

        const owner = '18294868853@s.whatsapp.net';
        if (character.id === "35" && userId !== owner) {
            return conn.reply(m.chat, '¡Ese personaje solo puede ser reclamado por Dioneibi!', m);
        }

        if (character.user && character.user !== userId) {
            return conn.reply(m.chat, `✧ El personaje *${character.name}* ya fue reclamado por @${character.user.split('@')[0]}.`, m, { mentions: [character.user] });
        }

        character.user = userId;
        character.status = 'Reclamado';
        await saveCharacters(characters);

        if (global.activeRolls && global.activeRolls[id]) {
            delete global.activeRolls[id];
        }

        const username = await conn.getName(userId);
        const mensajeFinal = await getCustomClaimMessage(userId, username, character.name);
        await conn.reply(m.chat, mensajeFinal, m);

        cooldowns[userId] = now + 30 * 60 * 1000;

    } catch (e) {
        conn.reply(m.chat, `✘ Error al reclamar waifu:\n${e.message}`, m);
    }
};

handler.help = ['claim'];
handler.tags = ['waifus'];
handler.command = ['claim', 'reclamar', 'c'];
handler.group = true;
export default handler;