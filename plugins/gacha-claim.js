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

async function getCustomClaimMessage(userId, username, characterName, timeTaken) {
    const messages = await loadClaimMessages();
    const template = messages[userId] || '❀ *$character* ha sido reclamado por *$user* ($time)';
    return template.replace(/\$user/g, username).replace(/\$character/g, characterName).replace(/\$time/g, timeTaken);
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = cooldowns[userId] - now;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return conn.reply(m.chat, `𝗗𝗲𝗯𝗲𝘀 𝗲𝘀𝗽𝗲𝗿𝗮𝗿 *${minutes}m ${seconds}s* 𝗽𝗮𝗿𝗮 𝘃𝗼𝗹𝘃𝗲𝗿 𝗮 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿.`, m);
    }

    if (!m.quoted || !m.quoted.text) {
        return conn.reply(m.chat, '𝗗𝗲𝗯𝗲𝘀 *𝗰𝗶𝘁𝗮𝗿 𝘂𝗻 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘃𝗮́𝗹𝗶𝗱𝗼* 𝗽𝗮𝗿𝗮 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿𝗹𝗼.', m);
    }

    try {
        const characters = await loadCharacters();
        const match = m.quoted.text.match(/𝙄𝘿:\s*\*([^\*]+)\*/i);
        if (!match) return conn.reply(m.chat, '《✧》No se pudo detectar el ID del personaje.', m);

        const id = match[1].trim();
        const character = characters.find(c => c.id === id);

        if (!character) return conn.reply(m.chat, '《✧》Personaje no encontrado.', m);

        const rollData = global.activeRolls ? global.activeRolls[id] : null;
        let timeTakenMsg = '';

        if (rollData) {
            const timeElapsed = now - rollData.time;

            if (timeElapsed > 120000) {
                delete global.activeRolls[id];
                return conn.reply(m.chat, "𝗘𝘀𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘆𝗮 𝗲𝘅𝗽𝗶𝗿𝗼́ 𝘆 𝗻𝗮𝗱𝗶𝗲 𝗽𝘂𝗲𝗱𝗲 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿𝗹𝗼.", m);
            }

            if (timeElapsed < 60000 && rollData.user !== userId) {
                const protectedBy = await conn.getName(rollData.user);
                const remainingProtection = ((60000 - timeElapsed) / 1000).toFixed(1);
                return conn.reply(m.chat, `𝗘𝗹 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 *${character.name}* 𝗲𝘀𝘁𝗮́ 𝗽𝗿𝗼𝘁𝗲𝗴𝗶𝗱𝗼 𝗽𝗼𝗿 *${protectedBy}* 𝗗𝘂𝗿𝗮𝗻𝘁𝗲 *${remainingProtection}s*`, m);
            }
            timeTakenMsg = `${(timeElapsed / 1000).toFixed(1)}s`;
        } else {
            if (!character.user) {
                return conn.reply(m.chat, "𝗘𝘀𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘆𝗮 𝗲𝘅𝗽𝗶𝗿𝗼́ 𝘆 𝗻𝗮𝗱𝗶𝗲 𝗽𝘂𝗲𝗱𝗲 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿𝗹𝗼.", m);
            }
            timeTakenMsg = 'N/A';
        }

        const owner = '18294868853@s.whatsapp.net';
        if (character.id === "35" && userId !== owner) {
            return conn.reply(m.chat, '¡Ese personaje solo puede ser reclamado por Dioneibi!', m);
        }

        if (character.user && character.user !== userId) {
            return conn.reply(m.chat, `𝗘𝗹 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 *${character.name}* 𝘆𝗮 𝗳𝘂𝗲 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗱𝗼 𝗽𝗼𝗿 @${character.user.split('@')[0]}.`, m, { mentions: [character.user] });
        }

        character.user = userId;
        character.status = 'Reclamado';
        await saveCharacters(characters);

        if (global.activeRolls && global.activeRolls[id]) {
            delete global.activeRolls[id];
        }

        const username = await conn.getName(userId);
        let mensajeFinal;
        
        const messages = await loadClaimMessages();
        if (messages[userId]) {
            mensajeFinal = messages[userId]
                .replace(/\$user/g, username)
                .replace(/\$character/g, character.name)
                .replace(/\$time/g, timeTakenMsg);
        } else {
            mensajeFinal = `❀ *${character.name}* ha sido reclamado por *${username}* (${timeTakenMsg})`;
        }

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