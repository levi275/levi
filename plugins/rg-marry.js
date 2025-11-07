/* Código original de Destroy, adaptado y mejorado.
*/

import fs from 'fs';
import path from 'path';

const marriagesFile = path.resolve('src/database/casados.json'); 
let proposals = {}; 
let marriages = loadMarriages();
const confirmation = {};

function loadMarriages() {
    try {
        return fs.existsSync(marriagesFile) ? JSON.parse(fs.readFileSync(marriagesFile, 'utf8')) : {};
    } catch (e) {
        console.error("Error al cargar casados.json:", e);
        return {};
    }
}

function saveMarriages() {
    try {
        fs.writeFileSync(marriagesFile, JSON.stringify(marriages, null, 2));
    } catch (e) {
        console.error("Error al guardar casados.json:", e);
    }
}

const handler = async (m, { conn, command }) => {
    const isPropose = /^marry$/i.test(command);
    const isDivorce = /^divorce$/i.test(command);

    const userIsMarried = (user) => marriages[user] !== undefined;

    try {
        if (isPropose) {
            const proposee = m.quoted?.sender || m.mentionedJid?.[0];
            const proposer = m.sender;

            if (!proposee) {
                if (userIsMarried(proposer)) {
                    return await conn.reply(m.chat, `《✧》 Ya estás casado con *${conn.getName(marriages[proposer].partner)}*\n> Puedes divorciarte con el comando: *#divorce*`, m);
                } else {
                    throw new Error('Debes mencionar a alguien para aceptar o proponer matrimonio.\n> *Ejemplo:* #marry @Usuario');
                }
            }
            
            if (userIsMarried(proposer)) throw new Error(`Ya estás casado con ${conn.getName(marriages[proposer].partner)}.`);
            if (userIsMarried(proposee)) throw new Error(`${conn.getName(proposee)} ya está casado con ${conn.getName(marriages[proposee].partner)}.`);
            if (proposer === proposee) throw new Error('¡No puedes proponerte matrimonio a ti mismo!');
            if (confirmation[proposee]) throw new Error(`Esa persona ya tiene una propuesta de matrimonio pendiente.`)

            proposals[proposer] = proposee;
            const proposerName = conn.getName(proposer);
            const proposeeName = conn.getName(proposee);


            const confirmationMessage = `♡ ${proposerName} te ha propuesto matrimonio, ${proposeeName} 💍\n\n¿Aceptas? •(=^●ω●^=)•`;

            const buttons = [
                { buttonId: 'marry_accept', buttonText: { displayText: 'Sí, acepto 💞' }, type: 1 },
                { buttonId: 'marry_reject', buttonText: { displayText: 'No, gracias 💔' }, type: 1 }
            ];

            const fkont = {
                key: {
                    fromMe: false,
                    participant: '0@s.whatsapp.net',
                    remoteJid: 'status@broadcast'
                },
                message: {
                    "contactMessage": {
                        "displayName": "💍 PROPUESTA DE MATRIMONIO 💍",
                        "vcard": "BEGIN:VCARD\nVERSION:3.0\nN:;Test;;;\nFN:Test\nORG:Test\nTITLE:\nTEL;type=CELL;type=VOICE;waid=0:+0\nEND:VCARD"
                    }
                }
            };

            await conn.sendMessage(m.chat, {
                text: confirmationMessage,
                buttons: buttons,
                footer: 'Tienes 60 segundos para responder',
                mentions: [proposee, proposer]
            }, { quoted: fkont });

            confirmation[proposee] = {
                proposer,
                timeout: setTimeout(() => {
                    conn.sendMessage(m.chat, { text: '*《✧》Se acabó el tiempo, no se obtuvo respuesta. La propuesta de matrimonio fue cancelada.*' }, { quoted: m });
                    delete confirmation[proposee];
                }, 60000)
            };

        } else if (isDivorce) {
            if (!userIsMarried(m.sender)) throw new Error('No estás casado con nadie.');

            const partner = marriages[m.sender].partner;
            delete marriages[m.sender];
            delete marriages[partner];
            saveMarriages();

            if (global.db.data.users[m.sender]) global.db.data.users[m.sender].marry = '';
            if (global.db.data.users[partner]) global.db.data.users[partner].marry = '';

            await conn.reply(m.chat, `✐ ${conn.getName(m.sender)} y ${conn.getName(partner)} se han divorciado. 💔`, m);
        }
    } catch (error) {
        await conn.reply(m.chat, `《✧》 ${error.message}`, m);
    }
};

handler.before = async (m, { conn }) => {
    if (m.isBaileys) return;
    
    if (!(m.sender in confirmation)) return;
    
    if (!m.text) return; 

    const respuesta = m.text.trim();
    const { proposer, timeout } = confirmation[m.sender];

    if (respuesta === 'marry_reject') {
        clearTimeout(timeout);
        delete confirmation[m.sender];
        return conn.sendMessage(m.chat, { text: `《✧》 ${conn.getName(m.sender)} ha rechazado la propuesta de matrimonio 💔` }, { quoted: m, mentions: [m.sender, proposer] });
    }

    if (respuesta === 'marry_accept') {
        clearTimeout(timeout);
        delete confirmation[m.sender];
        delete proposals[proposer];

        const fecha = Date.now();

        marriages[proposer] = { partner: m.sender, date: fecha };
        marriages[m.sender] = { partner: proposer, date: fecha };
        saveMarriages();

        if (global.db?.data?.users[proposer]) global.db.data.users[proposer].marry = m.sender;
        if (global.db?.data?.users[m.sender]) global.db.data.users[m.sender].marry = proposer;

        await conn.sendMessage(m.chat, {
            text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩
💞 ¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧

*•.¸♡ Esposo:* ${conn.getName(proposer)}
*•.¸♡ Esposa:* ${conn.getName(m.sender)}

🎉 ¡Disfruten de su luna de miel! 🍓💍
✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
            mentions: [proposer, m.sender]
        }, { quoted: m });
    }
};

handler.tags = ['fun'];
handler.help = ['marry *@usuario*', 'divorce'];
handler.command = ['marry', 'divorce'];
handler.group = true;

export default handler;