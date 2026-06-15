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
  descripcion: 'Borrar mensajes de forma manual',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '🧹', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    if (!args.length) {
      await sock.sendMessage(from, {
        text: '_¿Cómo quieres limpiar?_\n\n> ✦ *Cantidad:* .purge 50\n> ✦ *Tiempo:* .purge 10m / 30s / 2h\n> ✦ *Máx:* 500 mensajes.'
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
          text: '_Eso no lo entiendo. Usa un número (.purge 50) o tiempo (.purge 10m)._'
        }, { quoted: msg })
        return
      }
      mensajes = getLastMsgs(from, Math.min(n, 500))
    }

    if (!mensajes.length) {
      await sock.sendMessage(from, {
        text: '_No hay mensajes que limpiar en ese rango._'
      }, { quoted: msg })
      return
    }

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

    await sock.sendMessage(from, {
      text: `_Limpieza lista._\n> ✦ *Eliminados:* ${eliminados}${fallidos ? `\n> ✦ *Fallidos:* ${fallidos}` : ''}`
    }, { quoted: msg })
  }
}