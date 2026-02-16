// helpers para gacha por grupo (mejoras: sin restauración automática, escrituras atómicas,
// mutex, transacciones y helpers atómicos)
import { promises as fs } from 'fs';
import path from 'path';

const haremFilePath = path.join(process.cwd(), 'src', 'database', 'harem.json');
const ventasFilePath = path.join(process.cwd(), 'src', 'database', 'waifusVenta.json');
const backupsDir = path.join(process.cwd(), 'src', 'database', 'backups');

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

async function readJsonFileSafeNoRestore(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    // Si el archivo no existe o está corrupto devolvemos null para que el llamador decida
    return null;
  }
}

async function writeJsonFileAtomic(filePath, data, backupPrefix) {
  await ensureBackupsDir();
  try {
    const timestamp = Date.now();
    const backupPath = path.join(backupsDir, `${backupPrefix}-${timestamp}.json`);
    // crear backup con la data que se va a escribir (no obligatorio, pero útil)
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8').catch(() => {});
  } catch (e) {
    // no bloquear en caso de fallo de backup
  }
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmp, filePath);
}

// Cargar Harem (no restaura automáticamente desde backups)
async function loadHarem() {
  const parsed = await readJsonFileSafeNoRestore(haremFilePath);
  if (Array.isArray(parsed)) return parsed;
  // Si archivo no existe o está corrupto, devolvemos array vacío (no sobrescribimos)
  return [];
}

// Escritura atómica con mutex
async function saveHarem(harem) {
  return haremMutex.runExclusive(async () => {
    await writeJsonFileAtomic(haremFilePath, harem, 'harem');
  });
}

// Cargar Ventas
async function loadVentas() {
  const parsed = await readJsonFileSafeNoRestore(ventasFilePath);
  if (Array.isArray(parsed)) return parsed;
  return [];
}

async function saveVentas(ventas) {
  return ventasMutex.runExclusive(async () => {
    await writeJsonFileAtomic(ventasFilePath, ventas, 'ventas');
  });
}

// Transacciones para evitar read-modify-write races (single-process)
async function runHaremTransaction(fn) {
  return haremMutex.runExclusive(async () => {
    const harem = await loadHarem();
    const result = await fn(harem);
    await writeJsonFileAtomic(haremFilePath, harem, 'harem');
    return result;
  });
}

async function runVentasTransaction(fn) {
  return ventasMutex.runExclusive(async () => {
    const ventas = await loadVentas();
    const result = await fn(ventas);
    await writeJsonFileAtomic(ventasFilePath, ventas, 'ventas');
    return result;
  });
}

// Transacción combinada para operaciones que tocan ambos archivos.
// Bloquea siempre haremMutex primero y luego ventasMutex para evitar deadlocks.
async function runCombinedTransaction(fn) {
  // lock order must be consistent
  await haremMutex.lock();
  await ventasMutex.lock();
  try {
    const harem = await loadHarem();
    const ventas = await loadVentas();
    const result = await fn(harem, ventas);
    // write back both
    await writeJsonFileAtomic(haremFilePath, harem, 'harem');
    await writeJsonFileAtomic(ventasFilePath, ventas, 'ventas');
    return result;
  } finally {
    ventasMutex.unlock();
    haremMutex.unlock();
  }
}

// Helpers por grupo (pueden usarse sobre estructuras en memoria)
function userKey(groupId, userId) { return `${groupId}:${userId}`; }
function charKey(groupId, charId) { return `${groupId}:${charId}`; }

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
    harem.push({ groupId, userId, characterId, lastClaimTime: now });
  }
}

function removeClaim(harem, groupId, userId, characterId) {
  const idx = harem.findIndex(e => e.groupId === groupId && e.characterId === characterId && e.userId === userId);
  if (idx !== -1) {
    harem.splice(idx, 1);
    return true;
  }
  return false;
}

function bulkAddClaims(harem, groupId, userId, characterIds) {
  let count = 0;
  const now = Date.now();
  for (const characterId of characterIds) {
    const existing = harem.find(e => e.groupId === groupId && e.characterId === characterId);
    if (existing) {
      existing.userId = userId;
      existing.lastClaimTime = now;
    } else {
      harem.push({ groupId, userId, characterId, lastClaimTime: now });
    }
    count++;
  }
  return count;
}

// Ventas por grupo (en memoria)
function findVenta(ventas, groupId, characterIdOrName) {
  return ventas.find(v => v.groupId === groupId && (v.id === characterIdOrName || v.name.toLowerCase() === String(characterIdOrName).toLowerCase()));
}

function addOrUpdateVenta(ventas, groupId, venta) {
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
    return ventas.splice(idx, 1)[0];
  }
  return null;
}

function getVentasInGroup(ventas, groupId) {
  return ventas.filter(v => v.groupId === groupId);
}

// Operaciones atómicas expuestas (para que plugins no usen load-modify-save manual)
async function claimCharacterAtomic(groupId, userId, characterId) {
  return runHaremTransaction(harem => {
    addOrUpdateClaim(harem, groupId, userId, characterId);
    return true;
  });
}

async function removeClaimAtomic(groupId, userId, characterId) {
  return runHaremTransaction(harem => {
    return removeClaim(harem, groupId, userId, characterId);
  });
}

async function bulkAddClaimsAtomic(groupId, userId, characterIds) {
  return runHaremTransaction(harem => {
    return bulkAddClaims(harem, groupId, userId, characterIds);
  });
}

// Exportaciones
export {
  loadHarem,
  saveHarem,
  loadVentas,
  saveVentas,
  runHaremTransaction,
  runVentasTransaction,
  runCombinedTransaction,
  claimCharacterAtomic,
  removeClaimAtomic,
  bulkAddClaimsAtomic,
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