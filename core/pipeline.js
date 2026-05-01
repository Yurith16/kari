import { getRealJid, cleanNumber } from '../utils/jid.js'
import { logger, delay }           from '../utils/helpers.js'
import { checkSpam }               from '../utils/spam.js'
import { commands }                from './plugins.js'
import { getGroup, isMuted, isBanned, trackActivity, updateGroupName } from './sqlite.js'

const LINK_RE = /(?:https?:\/\/)?(?:www\.)?(?:chat\.whatsapp\.com|wa\.me|t\.me|telegram\.(?:me|dog|org))\/\S+/i

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractText(msg) {
  const m = msg.message
  return m?.conversation
      || m?.extendedTextMessage?.text
      || m?.imageMessage?.caption
      || m?.videoMessage?.caption
      || m?.documentMessage?.caption
      || ''
}

function matchPrefix(text) {
  for (const p of (global.bot?.prefix || ['.'])) {
    if (text.startsWith(p)) return { prefix: p, rest: text.slice(p.length).trim() }
  }
  return null
}

async function resolveContext(sock, msg) {
  const from    = msg.key.remoteJid
  const isGroup = from.endsWith('@g.us')
  const sender  = msg.key.participant || from
  const fromMe  = msg.key.fromMe

  let realJid = sender
  try { realJid = await getRealJid(sock, sender, msg) } catch {}
  const userNum = cleanNumber(realJid)

  const ownerNums = [global.bot?.ownerNumber].flat().map(n => cleanNumber(n))
  const isOwner   = fromMe || ownerNums.includes(userNum)
  const groupCfg  = isGroup ? getGroup(from) : null

  let isAdmin = false
  if (isGroup) {
    try {
      const meta      = await sock.groupMetadata(from)
      const senderRaw = cleanNumber(sender) // número sin resolver (puede ser @lid)
      isAdmin = meta.participants.some(p =>
        p.admin && (
          cleanNumber(p.id) === userNum ||   // número real resuelto
          p.id === sender ||                  // JID exacto
          cleanNumber(p.id) === senderRaw    // número del @lid sin resolver
        )
      )
      if (meta.subject) updateGroupName(from, meta.subject)
    } catch {}
  }

  return { from, isGroup, sender, fromMe, realJid, userNum, isOwner, isAdmin, groupCfg }
}

// ─── Pipeline steps ───────────────────────────────────────────────────────────

async function stepAntiLink(ctx, sock, msg) {
  if (!global.features?.antiLink)                 return false
  if (!ctx.isGroup || ctx.isOwner || ctx.isAdmin) return false
  if (!ctx.groupCfg?.antiLink || ctx.groupCfg?.antiLink !== 1)    return false
  if (!LINK_RE.test(extractText(msg)))            return false
  try {
    await sock.sendMessage(ctx.from, { delete: msg.key })
    await sock.sendMessage(ctx.from, { text: global.messages?.antiLink }, { quoted: msg })
  } catch {}
  return true
}

async function stepMute(ctx, sock, msg) {
  if (!ctx.isGroup || ctx.isOwner || ctx.isAdmin) return false
  // Verificar con userNum resuelto Y con número limpio del sender original
  const senderNum = cleanNumber(ctx.sender)
  if (!isMuted(ctx.from, ctx.userNum) && !isMuted(ctx.from, senderNum)) return false
  try {
    // Eliminar cualquier tipo de mensaje — texto, imagen, video, documento, sticker
    await sock.sendMessage(ctx.from, {
      delete: {
        remoteJid:   ctx.from,
        fromMe:      false,
        id:          msg.key.id,
        participant: ctx.sender
      }
    })
  } catch {}
  return true  // corta el flujo siempre, sin responder nada
}

async function stepGuards(ctx, sock, msg) {
  const feat = global.features || {}
  const msgs = global.messages || {}
  const bot  = global.bot     || {}

  // Ban global
  if (!ctx.isOwner && isBanned(ctx.userNum)) {
    await sock.sendMessage(ctx.from, { text: msgs.bannedWarn }, { quoted: msg })
    return true
  }

  if (feat.maintenance && !ctx.isOwner) {
    await sock.sendMessage(ctx.from, { text: msgs.maintenance }, { quoted: msg })
    return true
  }

  if (!ctx.isGroup && !feat.allowPrivate && !ctx.isOwner) {
    await sock.sendMessage(ctx.from, {
      text: (msgs.privateOnly || '').replace('{grupoOficial}', bot.grupoOficial || '')
    }, { quoted: msg })
    return true
  }

  if (ctx.isGroup && ctx.groupCfg?.adminMode === 1 && !ctx.isOwner && !ctx.isAdmin) {
    await sock.sendMessage(ctx.from, { text: msgs.adminOnly }, { quoted: msg })
    return true
  }

  if (feat.antiSpam && !ctx.isOwner) {
    const { blocked, secsLeft } = checkSpam(ctx.sender)
    if (blocked) {
      await sock.sendMessage(ctx.from, {
        text: (msgs.spamWarn || '⏳ Espera {secs}s').replace('{secs}', secsLeft)
      }, { quoted: msg })
      return true
    }
  }

  return false
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

async function dispatch(ctx, sock, msg) {
  const text  = extractText(msg)
  const match = matchPrefix(text)

  if (!match) {
    for (const cmd of commands.values()) {
      if (cmd.onMessage) await cmd.onMessage(sock, msg, ctx).catch(() => {})
    }
    return
  }

  const [cmdName, ...args] = match.rest.split(/\s+/)
  const cmd = commands.get(cmdName.toLowerCase())
  if (!cmd) return

  if (cmd.nsfw && ctx.isGroup && ctx.groupCfg?.nsfw !== 1 && !ctx.isOwner) {
    await sock.sendMessage(ctx.from, { text: global.messages?.nsfwDisabled }, { quoted: msg })
    return
  }
  if (cmd.owner && !ctx.isOwner) {
    await sock.sendMessage(ctx.from, { text: global.messages?.ownerOnly }, { quoted: msg })
    return
  }
  if (cmd.group && !ctx.isGroup) {
    await sock.sendMessage(ctx.from, { text: global.messages?.groupOnly }, { quoted: msg })
    return
  }

  logger.cmd(cmdName, ctx.userNum, ctx.isGroup ? ctx.groupCfg?.name : null)

  await delay()
  await cmd.execute(sock, msg, { ...ctx, args, prefix: match.prefix }).catch(err => {
    logger.error('Cmd', `${cmdName} — ${err.message}`)
    sock.sendMessage(ctx.from, { text: global.messages?.error }, { quoted: msg }).catch(() => {})
  })
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function handleMessage(sock, msg) {
  try {
    const ctx = await resolveContext(sock, msg)

    if (ctx.isGroup && !ctx.fromMe) trackActivity(ctx.from, ctx.userNum)

    if (await stepAntiLink(ctx, sock, msg)) return
    if (await stepMute(ctx, sock, msg))     return

    const match = matchPrefix(extractText(msg))
    if (match && await stepGuards(ctx, sock, msg)) return

    await dispatch(ctx, sock, msg)

  } catch (err) {
    if (/Bad MAC|decrypt|session/i.test(err.message)) return
    logger.error('Pipeline', err.message)
  }
}