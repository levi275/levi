// helpers para gacha por grupo (mejorado: locking, escrituras atómicas y backups)
import { promises as fs } from 'fs';
import path from 'path';

const haremFilePath = path.join(process.cwd(), 'src', 'database', 'harem.json');
const ventasFilePath = path.join(process.cwd(), 'src', 'database', 'waifusVenta.json');
const backupsDir = path.join(process.cwd(), 'src', 'database', 'backups');

// Simple mutex para serializar acceso al archivo
class Mutex {
  constructor() {
    this._locked = false;
    this._waiters = [];
  }
  async lock() {
    if (!this._locked) {
      this._locked = true;
      return;
    }
    await new Promise(resolve => this._waiters.push(resolve));
  }
  unlock() {
    if (this._waiters.length > 0) {
      const resolve = this._waiters.shift();
      resolve();
    } else {
      this._locked = false;
    }
  }
  async runExclusive(fn) {
    await this.lock();
    try {
      return await fn();
    } finally {
      this.unlock();
    }
  }
}

const haremMutex = new Mutex();
const ventasMutex = new Mutex();

async function ensureBackupsDir() {
  try {
    await fs.mkdir(backupsDir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function readJsonFileSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    // retorna null para indicar fallo/archivo inexistente/corrupto
    return null;
  }
}

async function loadHarem() {
  // Intenta leer, si está corrupto intenta recuperar del backup más reciente
  const data = await readJsonFileSafe(haremFilePath);
  if (Array.isArray(data)) return data;

  // intentar recuperar desde backup
  try {
    const files = await fs.readdir(backupsDir).catch(() => []);
    const haremBackups = files
      .filter(f => f.startsWith('harem-') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.stat(path.join(backupsDir, f)).then(s => s.mtimeMs) }));
    if (haremBackups.length === 0) return [];
    // ordenar por nombre (timestamp) o por mtime si prefieres
    haremBackups.sort((a, b) => b.name.localeCompare(a.name));
    for (const fb of haremBackups) {
      try {
        const raw = await fs.readFile(path.join(backupsDir, fb.name), 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // restaurar archivo principal
          await fs.writeFile(haremFilePath, JSON.stringify(parsed, null, 2), 'utf-8');
          return parsed;
        }
      } catch (e) {
        // sigue con el siguiente backup
      }
    }
  } catch (e) {
    // no hay backup o no fue posible
  }
  return [];
}

async function saveHarem(harem) {
  // serializar acceso para evitar condiciones de carrera
  return haremMutex.runExclusive(async () => {
    await ensureBackupsDir();
    // crear backup antes de sobreescribir (no obligatorio, pero ayuda)
    try {
      const timestamp = Date.now();
      const backupPath = path.join(backupsDir, `harem-${timestamp}.json`);
      await fs.writeFile(backupPath, JSON.stringify(harem, null, 2), 'utf-8');
    } catch (e) {
      // no block on backup error, seguimos con la escritura atómica
    }
    const tmp = `${haremFilePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(harem, null, 2), 'utf-8');
    await fs.rename(tmp, haremFilePath);
  });
}

async function loadVentas() {
  const data = await readJsonFileSafe(ventasFilePath);
  if (Array.isArray(data)) return data;

  // intentar recuperar desde backup
  try {
    const files = await fs.readdir(backupsDir).catch(() => []);
    const ventasBackups = files
      .filter(f => f.startsWith('ventas-') && f.endsWith('.json'))
      .map(f => ({ name: f }));
    if (ventasBackups.length === 0) return [];
    ventasBackups.sort((a, b) => b.name.localeCompare(a.name));
    for (const fb of ventasBackups) {
      try {
        const raw = await fs.readFile(path.join(backupsDir, fb.name), 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          await fs.writeFile(ventasFilePath, JSON.stringify(parsed, null, 2), 'utf-8');
          return parsed;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return [];
}

async function saveVentas(ventas) {
  return ventasMutex.runExclusive(async () => {
    await ensureBackupsDir();
    try {
      const timestamp = Date.now();
      const backupPath = path.join(backupsDir, `ventas-${timestamp}.json`);
      await fs.writeFile(backupPath, JSON.stringify(ventas, null, 2), 'utf-8');
    } catch (e) {}
    const tmp = `${ventasFilePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(ventas, null, 2), 'utf-8');
    await fs.rename(tmp, ventasFilePath);
  });
}

// Helpers por grupo
function userKey(groupId, userId) {
  return `${groupId}:${userId}`;
}
function charKey(groupId, charId) {
  return `${groupId}:${charId}`;
}

function findClaim(harem, groupId, characterId) {
  return harem.find(entry => entry.groupId === groupId && entry.characterId === characterId) || null;
}

function findClaimByUserAndChar(harem, groupId, userId, characterId) {
  return harem.find(entry => entry.groupId === groupId && entry.characterId === characterId && entry.userId === userId) || null;
}

function getUserClaims(harem, groupId, userId) {
  return harem.filter(entry => entry.groupId === groupId && entry.userId === userId);
}

function addOrUpdateClaim(harem, groupId, userId, characterId) {
  const existing = harem.find(e => e.groupId === groupId && e.characterId === characterId);
  const now = Date.now();
  if (existing) {
    existing.userId = userId;
    existing.lastClaimTime = now;
  } else {
    harem.push({
      groupId,
      userId,
      characterId,
      lastClaimTime: now
    });
  }
}

// Bulk add/restore (devuelve número de añadidos o reasignados)
function bulkAddClaims(harem, groupId, userId, characterIds) {
  let count = 0;
  const now = Date.now();
  for (const characterId of characterIds) {
    const existing = harem.find(e => e.groupId === groupId && e.characterId === characterId);
    if (existing) {
      existing.userId = userId;
      existing.lastClaimTime = now;
    } else {
      harem.push({
        groupId,
        userId,
        characterId,
        lastClaimTime: now
      });
    }
    count++;
  }
  return count;
}

function removeClaim(harem, groupId, userId, characterId) {
  const idx = harem.findIndex(e => e.groupId === groupId && e.characterId === characterId && e.userId === userId);
  if (idx !== -1) {
    harem.splice(idx, 1);
    return true;
  }
  return false;
}

// Ventas por grupo
function findVenta(ventas, groupId, characterIdOrName) {
  return ventas.find(v => v.groupId === groupId && (v.id === characterIdOrName || v.name.toLowerCase() === String(characterIdOrName).toLowerCase()));
}

function addOrUpdateVenta(ventas, groupId, venta) {
  // venta: { id, name, precio, vendedor, fecha }
  const existing = ventas.find(v => v.groupId === groupId && v.id === venta.id);
  if (existing) {
    Object.assign(existing, venta, { groupId });
  } else {
    ventas.push(Object.assign({}, venta, { groupId }));
  }
}

function removeVenta(ventas, groupId, characterId) {
  const idx = ventas.findIndex(v => v.groupId === groupId && v.id === characterId);
  if (idx !== -1) {
    const removed = ventas.splice(idx, 1)[0];
    return removed;
  }
  return null;
}

function getVentasInGroup(ventas, groupId) {
  return ventas.filter(v => v.groupId === groupId);
}

export {
  loadHarem,
  saveHarem,
  loadVentas,
  saveVentas,
  userKey,
  charKey,
  findClaim,
  findClaimByUserAndChar,
  getUserClaims,
  addOrUpdateClaim,
  bulkAddClaims,
  removeClaim,
  findVenta,
  addOrUpdateVenta,
  removeVenta,
  getVentasInGroup
};