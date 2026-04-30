import Database from 'better-sqlite3'
import { logger } from '../utils/helpers.js'

const db = new Database('./midori.db')
db.pragma('journal_mode = WAL')   // escrituras concurrentes sin bloquear
db.pragma('synchronous = NORMAL') // balance entre seguridad y velocidad

// ─── Tablas ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    group_id   TEXT PRIMARY KEY,
    name       TEXT DEFAULT '',
    antiLink   INTEGER DEFAULT 0,
    adminMode  INTEGER DEFAULT 0,
    nsfw       INTEGER DEFAULT 0,
    welcomeMsg INTEGER DEFAULT 0,
    goodbyeMsg INTEGER DEFAULT 0,
    welcomeText TEXT DEFAULT '',
    goodbyeText TEXT DEFAULT '',
    updated_at INTEGER DEFAULT (unixepoch())
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

  CREATE TABLE IF NOT EXISTS activity (
    group_id TEXT,
    user     TEXT,
    msgs     INTEGER DEFAULT 0,
    last_seen INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (group_id, user)
  );
`)

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

const _mute   = db.prepare(`INSERT OR IGNORE INTO mutes (group_id, user) VALUES (?,?)`)
const _unmute = db.prepare(`DELETE FROM mutes WHERE group_id = ? AND user = ?`)
const _isMuted = db.prepare(`SELECT 1 FROM mutes WHERE group_id = ? AND user = ?`)

export function muteUser(groupId, user)   { _mute.run(groupId, user) }
export function unmuteUser(groupId, user) { _unmute.run(groupId, user) }
export function isMuted(groupId, user)    { return !!_isMuted.get(groupId, user) }

// ─── Activity ─────────────────────────────────────────────────────────────────

const _trackActivity = db.prepare(`
  INSERT INTO activity (group_id, user, msgs, last_seen) VALUES (?,?,1,unixepoch())
  ON CONFLICT(group_id,user) DO UPDATE SET msgs = msgs + 1, last_seen = unixepoch()
`)
const _getTopActivity = db.prepare(`SELECT user, msgs FROM activity WHERE group_id = ? ORDER BY msgs DESC LIMIT ?`)

export function trackActivity(groupId, user) { _trackActivity.run(groupId, user) }
export function getTopActivity(groupId, limit = 10) { return _getTopActivity.all(groupId, limit) }


// ─── Ban global ───────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS banned (
    user       TEXT PRIMARY KEY,
    banned_at  INTEGER DEFAULT (unixepoch())
  );
`)

const _ban      = db.prepare(`INSERT OR IGNORE INTO banned (user) VALUES (?)`)
const _unban    = db.prepare(`DELETE FROM banned WHERE user = ?`)
const _isBanned = db.prepare(`SELECT 1 FROM banned WHERE user = ?`)
const _getBanned = db.prepare(`SELECT user FROM banned ORDER BY banned_at DESC`)

export function banUser(user)    { _ban.run(user) }
export function unbanUser(user)  { _unban.run(user) }
export function isBanned(user)   { return !!_isBanned.get(user) }
export function getBanned()      { return _getBanned.all().map(r => r.user) }

export default db