import { getLastMsgs, getMsgsSince, deleteMsgFromHistory } from '../core/sqlite.js'

function parseTime(str) {
  const match = str.match(/^(\d+)(s|m|h)$/)
  if (!match) return null
  const val  = parseInt(match[1])
  const unit = match[2]
  if (unit === 's') return val
  if (unit === 'm') return val * 60
  if (unit === 'h') return val * 3600
  return null
}

export default {
  command:   'purgue',
  tag:       'purgue',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    if (!args.length) {
      await sock.sendMessage(from, {
        text: `🌸 *¿Cómo quieres limpiar?*\n\n` +
          `✨ Por cantidad:\n  .purge 50\n\n` +
          `⏳ Por tiempo:\n  .purge 10m  (últimos 10 minutitos)\n  .purge 30s  (últimos 30 segundos)\n  .purge 2h   (últimas 2 horas)\n\n` +
          `📦 Máximo 500 mensajitos por vez.`
      }, { quoted: msg })
      return
    }

    const arg  = args[0].toLowerCase()
    let mensajes = []

    const secs = parseTime(arg)
    if (secs !== null) {
      mensajes = getMsgsSince(from, secs)
    } else {
      const n = parseInt(arg)
      if (isNaN(n) || n < 1) {
        await sock.sendMessage(from, {
          text: '⚠️ Eso no lo entiendo. Usa un número (.purge 50) o tiempo (.purge 10m).'
        }, { quoted: msg })
        return
      }
      mensajes = getLastMsgs(from, Math.min(n, 500))
    }

    if (!mensajes.length) {
      await sock.sendMessage(from, {
        text: '🌸 No hay mensajes que limpiar en ese rango.'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🗑', key: msg.key } })

    let eliminados = 0
    let fallidos   = 0

    for (const m of mensajes) {
      try {
        await sock.sendMessage(from, {
          delete: {
            remoteJid:   from,
            fromMe:      false,
            id:          m.msg_id,
            participant: m.sender
          }
        })
        deleteMsgFromHistory(from, m.msg_id)
        eliminados++
        await new Promise(r => setTimeout(r, 150))
      } catch {
        fallidos++
      }
    }

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
    await sock.sendMessage(from, {
      text: `✨ Limpieza lista.\n🗑 Eliminados: *${eliminados}*${fallidos ? `\n⚠️ No se pudieron borrar: *${fallidos}* (muy viejitos o sin permisos)` : ''}`
    }, { quoted: msg })
  }
}