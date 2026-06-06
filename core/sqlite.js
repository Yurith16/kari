import Database from 'better-sqlite3'
import { logger } from '../utils/helpers.js'

const db = new Database('./midori.db')
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    group_id    TEXT PRIMARY KEY,
    name        TEXT DEFAULT '',
    antiLink    INTEGER DEFAULT 0,
    adminMode   INTEGER DEFAULT 0,
    nsfw        INTEGER DEFAULT 0,
    welcomeMsg  INTEGER DEFAULT 0,
    goodbyeMsg  INTEGER DEFAULT 0,
    welcomeText TEXT DEFAULT '',
    goodbyeText TEXT DEFAULT '',
    welcomeImg  TEXT DEFAULT '',
    goodbyeImg  TEXT DEFAULT '',
    updated_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS warns (
    group_id TEXT,
    user     TEXT,
    count    INTEGER DEFAULT 0,
    PRIMARY KEY (group_id, user)
  );

  CREATE TABLE IF NOT EXISTS mutes (
    group_id TEXT,
    user     TEXT,
    muted_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (group_id, user)
  );

  CREATE TABLE IF NOT EXISTS ignored (
  group_id TEXT,
  user     TEXT,
  PRIMARY KEY (group_id, user)
);

  CREATE TABLE IF NOT EXISTS activity (
    group_id  TEXT,
    user      TEXT,
    msgs      INTEGER DEFAULT 0,
    last_seen INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (group_id, user)
  );

  CREATE TABLE IF NOT EXISTS msg_history (
    group_id TEXT,
    msg_id   TEXT,
    sender   TEXT,
    sent_at  INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (group_id, msg_id)
  );

  CREATE TABLE IF NOT EXISTS banned (
    user      TEXT PRIMARY KEY,
    banned_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS users (
    user_num      TEXT PRIMARY KEY,
    nombre        TEXT DEFAULT '',
    apodo         TEXT DEFAULT '',
    edad          INTEGER DEFAULT 0,
    genero        TEXT DEFAULT '',
    pais          TEXT DEFAULT '',
    registered_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS economy (
    user_num TEXT PRIMARY KEY,
    kryons   INTEGER DEFAULT 0,
    banco    INTEGER DEFAULT 0,
    nivel    INTEGER DEFAULT 1,
    xp       INTEGER DEFAULT 0,
    FOREIGN KEY (user_num) REFERENCES users(user_num)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_num TEXT,
    item     TEXT,
    cantidad INTEGER DEFAULT 1,
    UNIQUE(user_num, item)
  );

  CREATE TABLE IF NOT EXISTS cooldowns (
    user_num TEXT,
    cmd      TEXT,
    last_use INTEGER DEFAULT 0,
    PRIMARY KEY (user_num, cmd)
  );

  CREATE TABLE IF NOT EXISTS tienda (
    item        TEXT PRIMARY KEY,
    precio      INTEGER DEFAULT 0,
    descripcion TEXT DEFAULT '',
    emoji       TEXT DEFAULT '📦'
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user  TEXT NOT NULL,
    to_user    TEXT NOT NULL,
    type       TEXT NOT NULL CHECK(type IN ('novio', 'casarse')),
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(from_user, to_user, type)
  );

  CREATE TABLE IF NOT EXISTS subbots (
    numero     TEXT PRIMARY KEY,
    moderador  TEXT DEFAULT '',
    nombre     TEXT DEFAULT '',
    sesion     TEXT DEFAULT '',
    activo     INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS subbot_grupos (
    subbot_num TEXT,
    group_id   TEXT,
    activo     INTEGER DEFAULT 1,
    PRIMARY KEY (subbot_num, group_id)
  );
`)

// ─── Migraciones seguras ──────────────────────────────────────────────────────

try { db.exec(`ALTER TABLE groups ADD COLUMN prefix TEXT DEFAULT ''`) }       catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN antiToxic INTEGER DEFAULT 1`) }  catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN welcomeImg TEXT DEFAULT ''`) }   catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN goodbyeImg TEXT DEFAULT ''`) }   catch {}
try { db.exec(`ALTER TABLE groups ADD COLUMN economia INTEGER DEFAULT 1`) }   catch {}

for (const col of ['frase', 'color', 'animal', 'foto', 'pareja']) {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT DEFAULT ''`) } catch {}
}
try { db.exec(`ALTER TABLE users ADD COLUMN estado TEXT DEFAULT 'soltero'`) }    catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN noviazgo_fecha INTEGER DEFAULT 0`) } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN matrimonio_fecha INTEGER DEFAULT 0`) } catch {}

// Migración subbot_grupos — agregar columna activo si no existe
try { db.exec(`ALTER TABLE subbot_grupos ADD COLUMN activo INTEGER DEFAULT 1`) } catch {}

logger.info('SQLite', 'Base de datos lista ✦')

// ─── Groups ───────────────────────────────────────────────────────────────────

const _getGroup    = db.prepare(`SELECT * FROM groups WHERE group_id = ?`)
const _insertGroup = db.prepare(`INSERT OR IGNORE INTO groups (group_id) VALUES (?)`)
const _patchGroup  = (col) => db.prepare(`UPDATE groups SET ${col} = ?, updated_at = unixepoch() WHERE group_id = ?`)

export function getGroup(groupId) {
  _insertGroup.run(groupId)
  return _getGroup.get(groupId)
}
export function setGroupField(groupId, field, value) {
  _insertGroup.run(groupId)
  _patchGroup(field).run(value, groupId)
}
export function updateGroupName(groupId, name) {
  setGroupField(groupId, 'name', name)
}

// ─── Warns ────────────────────────────────────────────────────────────────────

const _getWarns   = db.prepare(`SELECT count FROM warns WHERE group_id = ? AND user = ?`)
const _addWarn    = db.prepare(`INSERT INTO warns (group_id, user, count) VALUES (?,?,1) ON CONFLICT(group_id,user) DO UPDATE SET count = count + 1`)
const _resetWarns = db.prepare(`DELETE FROM warns WHERE group_id = ? AND user = ?`)

export function getWarns(groupId, user)   { return _getWarns.get(groupId, user)?.count || 0 }
export function addWarn(groupId, user)    { _addWarn.run(groupId, user); return getWarns(groupId, user) }
export function resetWarns(groupId, user) { _resetWarns.run(groupId, user) }

// ─── Mutes ────────────────────────────────────────────────────────────────────

const _mute    = db.prepare(`INSERT OR IGNORE INTO mutes (group_id, user) VALUES (?,?)`)
const _unmute  = db.prepare(`DELETE FROM mutes WHERE group_id = ? AND user = ?`)
const _isMuted = db.prepare(`SELECT 1 FROM mutes WHERE group_id = ? AND user = ?`)

export function muteUser(groupId, user)   { _mute.run(groupId, user) }
export function unmuteUser(groupId, user) { _unmute.run(groupId, user) }
export function isMuted(groupId, user)    { return !!_isMuted.get(groupId, user) }

// ─── Activity ─────────────────────────────────────────────────────────────────

const _trackActivity  = db.prepare(`
  INSERT INTO activity (group_id, user, msgs, last_seen) VALUES (?,?,1,unixepoch())
  ON CONFLICT(group_id,user) DO UPDATE SET msgs = msgs + 1, last_seen = unixepoch()
`)
const _getTopActivity = db.prepare(`SELECT user, msgs FROM activity WHERE group_id = ? ORDER BY msgs DESC LIMIT ?`)

export function trackActivity(groupId, user)       { _trackActivity.run(groupId, user) }
export function getTopActivity(groupId, limit = 10) { return _getTopActivity.all(groupId, limit) }

// ─── Historial de mensajes ────────────────────────────────────────────────────

const _saveMsg      = db.prepare(`INSERT OR IGNORE INTO msg_history (group_id, msg_id, sender, sent_at) VALUES (?,?,?,?)`)
const _cleanOld     = db.prepare(`DELETE FROM msg_history WHERE group_id = ? AND msg_id NOT IN (SELECT msg_id FROM msg_history WHERE group_id = ? ORDER BY sent_at DESC LIMIT 500)`)
const _getMsgsSince = db.prepare(`SELECT msg_id, sender FROM msg_history WHERE group_id = ? AND sent_at >= ? ORDER BY sent_at DESC`)
const _getLastMsgs  = db.prepare(`SELECT msg_id, sender FROM msg_history WHERE group_id = ? ORDER BY sent_at DESC LIMIT ?`)
const _deleteMsg    = db.prepare(`DELETE FROM msg_history WHERE group_id = ? AND msg_id = ?`)

export function saveMsg(groupId, msgId, sender) {
  _saveMsg.run(groupId, msgId, sender, Math.floor(Date.now() / 1000))
  _cleanOld.run(groupId, groupId)
}
export function getMsgsSince(groupId, seconds) {
  return _getMsgsSince.all(groupId, Math.floor(Date.now() / 1000) - seconds)
}
export function getLastMsgs(groupId, limit)          { return _getLastMsgs.all(groupId, limit) }
export function deleteMsgFromHistory(groupId, msgId) { _deleteMsg.run(groupId, msgId) }

// ─── Ban global ───────────────────────────────────────────────────────────────

const _ban       = db.prepare(`INSERT OR IGNORE INTO banned (user) VALUES (?)`)
const _unban     = db.prepare(`DELETE FROM banned WHERE user = ?`)
const _isBanned  = db.prepare(`SELECT 1 FROM banned WHERE user = ?`)
const _getBanned = db.prepare(`SELECT user FROM banned ORDER BY banned_at DESC`)

export function banUser(user)   { _ban.run(user) }
export function unbanUser(user) { _unban.run(user) }
export function isBanned(user)  { return !!_isBanned.get(user) }
export function getBanned()     { return _getBanned.all().map(r => r.user) }

// ─── Users ────────────────────────────────────────────────────────────────────

const _getUser      = db.prepare(`SELECT * FROM users WHERE user_num = ?`)
const _createUser   = db.prepare(`INSERT OR IGNORE INTO users (user_num, nombre, apodo, edad, genero, pais) VALUES (?,?,?,?,?,?)`)
const _updateUser   = db.prepare(`UPDATE users SET nombre=?, apodo=?, edad=?, genero=?, pais=? WHERE user_num=?`)
const _isRegistered = db.prepare(`SELECT 1 FROM users WHERE user_num = ? AND nombre != ''`)

export function getUser(userNum)      { return _getUser.get(userNum) }
export function isRegistered(userNum) { return !!_isRegistered.get(userNum) }

export function registerUser(userNum, { nombre, apodo, edad, genero, pais }) {
  _createUser.run(userNum, nombre, apodo || '', edad || 0, genero || '', pais || '')
  _initEconomy.run(userNum)
}
export function updateUser(userNum, { nombre, apodo, edad, genero, pais }) {
  _updateUser.run(nombre, apodo || '', edad, genero || '', pais || '', userNum)
}

// ─── Perfil extendido ─────────────────────────────────────────────────────────

const _setUserField = (field) => db.prepare(`UPDATE users SET ${field} = ? WHERE user_num = ?`)

export function setUserField(userNum, field, value) {
  _setUserField(field).run(value, userNum)
}
export function getAge(userNum) {
  return _getUser.get(userNum)?.edad || 0
}

// ─── Fechas de relación ───────────────────────────────────────────────────────

const _setNoviazgoFecha   = db.prepare(`UPDATE users SET noviazgo_fecha = ? WHERE user_num = ?`)
const _setMatrimonioFecha = db.prepare(`UPDATE users SET matrimonio_fecha = ? WHERE user_num = ?`)

export function setNoviazgoFecha(userNum, ts)   { _setNoviazgoFecha.run(ts, userNum) }
export function setMatrimonioFecha(userNum, ts) { _setMatrimonioFecha.run(ts, userNum) }
export function clearFechas(userNum) {
  db.prepare(`UPDATE users SET noviazgo_fecha = 0, matrimonio_fecha = 0 WHERE user_num = ?`).run(userNum)
}

// ─── Propuestas ───────────────────────────────────────────────────────────────

const _createProposal        = db.prepare(`INSERT OR REPLACE INTO proposals (from_user, to_user, type) VALUES (?,?,?)`)
const _getProposal           = db.prepare(`SELECT * FROM proposals WHERE to_user = ? AND type = ?`)
const _deleteProposal        = db.prepare(`DELETE FROM proposals WHERE from_user = ? AND to_user = ? AND type = ?`)
const _deleteProposalsByUser = db.prepare(`DELETE FROM proposals WHERE from_user = ? OR to_user = ?`)
const _getRelation           = db.prepare(`SELECT pareja, estado, noviazgo_fecha, matrimonio_fecha FROM users WHERE user_num = ?`)

export function createProposal(from, to, type)  { _createProposal.run(from, to, type) }
export function getProposal(userNum, type)       { return _getProposal.get(userNum, type) }
export function deleteProposal(from, to, type)   { _deleteProposal.run(from, to, type) }
export function clearProposals(userNum)          { _deleteProposalsByUser.run(userNum, userNum) }
export function getRelation(userNum)             { return _getRelation.get(userNum) }

export function setRelation(userNum, estado, pareja) {
  db.prepare(`UPDATE users SET estado = ?, pareja = ? WHERE user_num = ?`).run(estado, pareja, userNum)
}
export function breakRelation(userNum) {
  const rel = _getRelation.get(userNum)
  if (!rel?.pareja) return
  const q = db.prepare(`UPDATE users SET estado = 'soltero', pareja = '', noviazgo_fecha = 0, matrimonio_fecha = 0 WHERE user_num = ?`)
  q.run(userNum)
  q.run(rel.pareja)
}

// ─── Economy ──────────────────────────────────────────────────────────────────

const _initEconomy  = db.prepare(`INSERT OR IGNORE INTO economy (user_num) VALUES (?)`)
const _getEconomy   = db.prepare(`SELECT * FROM economy WHERE user_num = ?`)
const _addKryons    = db.prepare(`UPDATE economy SET kryons = kryons + ? WHERE user_num = ?`)
const _removeKryons = db.prepare(`UPDATE economy SET kryons = MAX(0, kryons - ?) WHERE user_num = ?`)
const _setBanco     = db.prepare(`UPDATE economy SET banco = banco + ? WHERE user_num = ?`)
const _removeBanco  = db.prepare(`UPDATE economy SET banco = MAX(0, banco - ?) WHERE user_num = ?`)
const _addXp        = db.prepare(`UPDATE economy SET xp = xp + ?, nivel = MAX(nivel, (xp + ?) / 120 + 1) WHERE user_num = ?`)
const _getTopEco    = db.prepare(`SELECT user_num, kryons + banco as total FROM economy ORDER BY total DESC LIMIT ?`)

export function getEconomy(userNum)        { _initEconomy.run(userNum); return _getEconomy.get(userNum) }
export function addKryons(userNum, amt)    { _initEconomy.run(userNum); _addKryons.run(amt, userNum) }
export function removeKryons(userNum, amt) { _removeKryons.run(amt, userNum) }
export function depositBanco(userNum, amt) { _removeKryons.run(amt, userNum); _setBanco.run(amt, userNum) }
export function withdrawBanco(userNum, amt){ _removeBanco.run(amt, userNum); _addKryons.run(amt, userNum) }
export function addXp(userNum, amt)        { _initEconomy.run(userNum); _addXp.run(amt, amt, userNum) }
export function getTopEconomy(limit = 10)  { return _getTopEco.all(limit) }

// ─── Cooldowns ────────────────────────────────────────────────────────────────

const _getCooldown = db.prepare(`SELECT last_use FROM cooldowns WHERE user_num = ? AND cmd = ?`)
const _setCooldown = db.prepare(`INSERT INTO cooldowns (user_num, cmd, last_use) VALUES (?,?,?) ON CONFLICT(user_num,cmd) DO UPDATE SET last_use = ?`)

export function checkCooldown(userNum, cmd, seconds) {
  const row = _getCooldown.get(userNum, cmd)
  const now = Math.floor(Date.now() / 1000)
  if (!row) return { ok: true, secsLeft: 0 }
  const diff = now - row.last_use
  if (diff >= seconds) return { ok: true, secsLeft: 0 }
  return { ok: false, secsLeft: seconds - diff }
}
export function setCooldown(userNum, cmd) {
  const now = Math.floor(Date.now() / 1000)
  _setCooldown.run(userNum, cmd, now, now)
}

// ─── Inventario ───────────────────────────────────────────────────────────────

const _addItem    = db.prepare(`INSERT INTO inventory (user_num, item, cantidad) VALUES (?,?,?) ON CONFLICT(user_num,item) DO UPDATE SET cantidad = cantidad + ?`)
const _getInv     = db.prepare(`SELECT item, cantidad FROM inventory WHERE user_num = ? ORDER BY item`)
const _removeItem = db.prepare(`UPDATE inventory SET cantidad = MAX(0, cantidad - ?) WHERE user_num = ? AND item = ?`)

export function addItem(userNum, item, cantidad = 1)    { _addItem.run(userNum, item, cantidad, cantidad) }
export function getInventory(userNum)                     { return _getInv.all(userNum) }
export function removeItem(userNum, item, cantidad = 1) { _removeItem.run(cantidad, userNum, item) }

// ─── Tienda ───────────────────────────────────────────────────────────────────

const _getTienda = db.prepare(`SELECT * FROM tienda ORDER BY precio`)
const _getItem   = db.prepare(`SELECT * FROM tienda WHERE item = ?`)

export function getTienda()      { return _getTienda.all() }
export function getItemTienda(i) { return _getItem.get(i) }

const tiendaCount = db.prepare(`SELECT COUNT(*) as n FROM tienda`).get()
if (tiendaCount.n === 0 || tiendaCount.n > 0) {
  // Limpiamos los registros antiguos para forzar la actualización de precios
  db.prepare(`DELETE FROM tienda`).run()

  const ins = db.prepare(`INSERT OR IGNORE INTO tienda (item, precio, descripcion, emoji) VALUES (?,?,?,?)`)
  ins.run('escudo',  12000, 'Protección absoluta de tu banco y cartera contra robos por 24h', '🛡️')
  ins.run('pico',    8000, 'Multiplica tus ganancias x3.5 al usar el comando minar', '⛏️')
  ins.run('maletín', 6000, 'Aumenta tus ganancias x2.5 en todos tus trabajos diarios', '💼')
  ins.run('capa',    15000, 'Invisibilidad total: Evita perder kryons si fallas un crimen', '🧥')
}

// ─── Subbots ──────────────────────────────────────────────────────────────────

const _createSubbot     = db.prepare(`INSERT OR IGNORE INTO subbots (numero, moderador, nombre, sesion, activo) VALUES (?,?,?,?,1)`)
const _getSubbot        = db.prepare(`SELECT * FROM subbots WHERE numero = ?`)
const _getAllSubbots     = db.prepare(`SELECT * FROM subbots`)
const _getActiveSubbots = db.prepare(`SELECT * FROM subbots WHERE activo = 1`)
const _setSubbotActivo  = db.prepare(`UPDATE subbots SET activo = ? WHERE numero = ?`)
const _deleteSubbot     = db.prepare(`DELETE FROM subbots WHERE numero = ?`)
const _countSubbots     = db.prepare(`SELECT COUNT(*) as n FROM subbots WHERE activo = 1`)
const _getSubbotByMod   = db.prepare(`SELECT * FROM subbots WHERE moderador = ?`)

export function createSubbot(numero, sesion) {
  // El moderador es el mismo número — dueño de su propio subbot
  _createSubbot.run(numero, numero, `Subbot-${numero}`, sesion)
}
export function getSubbot(numero)          { return _getSubbot.get(numero) }
export function getSubbotByModerador(mod)  { return _getSubbotByMod.get(mod) }
export function getAllSubbots()             { return _getAllSubbots.all() }
export function getActiveSubbots()         { return _getActiveSubbots.all() }
export function countActiveSubbots()       { return _countSubbots.get().n }
export function activarSubbot(numero)      { _setSubbotActivo.run(1, numero) }
export function desactivarSubbot(numero)   { _setSubbotActivo.run(0, numero) }
export function deleteSubbot(numero)       { _deleteSubbot.run(numero) }

// ─── Ignored (ignorar usuario en grupo) ──────────────────────────────────────

const _ignoreUser   = db.prepare(`INSERT OR IGNORE INTO ignored (group_id, user) VALUES (?,?)`)
const _unignoreUser = db.prepare(`DELETE FROM ignored WHERE group_id = ? AND user = ?`)
const _isIgnored    = db.prepare(`SELECT 1 FROM ignored WHERE group_id = ? AND user = ?`)
const _getIgnored   = db.prepare(`SELECT user FROM ignored WHERE group_id = ?`)

export function ignoreUser(groupId, user)   { _ignoreUser.run(groupId, user) }
export function unignoreUser(groupId, user) { _unignoreUser.run(groupId, user) }
export function isIgnored(groupId, user)    { return !!_isIgnored.get(groupId, user) }
export function getIgnored(groupId)         { return _getIgnored.all(groupId).map(r => r.user) }

// ─── Grupos por subbot ────────────────────────────────────────────────────────

const _addSubbotGrupo    = db.prepare(`INSERT OR IGNORE INTO subbot_grupos (subbot_num, group_id, activo) VALUES (?,?,1)`)
const _removeSubbotGrupo = db.prepare(`DELETE FROM subbot_grupos WHERE subbot_num = ? AND group_id = ?`)
const _toggleSubbotGrupo = db.prepare(`UPDATE subbot_grupos SET activo = ? WHERE subbot_num = ? AND group_id = ?`)
const _getSubbotGrupos   = db.prepare(`SELECT group_id FROM subbot_grupos WHERE subbot_num = ? AND activo = 1`)
const _getAllSubbotGrupos = db.prepare(`SELECT group_id, activo FROM subbot_grupos WHERE subbot_num = ?`)
const _isGrupoActivo     = db.prepare(`SELECT 1 FROM subbot_grupos WHERE subbot_num = ? AND group_id = ? AND activo = 1`)

export function addSubbotGrupo(subbotNum, groupId)         { _addSubbotGrupo.run(subbotNum, groupId) }
export function removeSubbotGrupo(subbotNum, groupId)      { _removeSubbotGrupo.run(subbotNum, groupId) }
export function activarSubbotGrupo(subbotNum, groupId)     { _toggleSubbotGrupo.run(1, subbotNum, groupId) }
export function desactivarSubbotGrupo(subbotNum, groupId)  { _toggleSubbotGrupo.run(0, subbotNum, groupId) }
export function getSubbotGrupos(subbotNum)                 { return _getSubbotGrupos.all(subbotNum).map(r => r.group_id) }
export function getAllSubbotGrupos(subbotNum)               { return _getAllSubbotGrupos.all(subbotNum) }
export function isGrupoActivoParaSubbot(subbotNum, groupId){ return !!_isGrupoActivo.get(subbotNum, groupId) }

export default db