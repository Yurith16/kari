import { getLastMsgs, getMsgsSince, deleteMsgFromHistory } from '../core/sqlite.js'

// Parsea tiempo: "10m" → 600s, "30s" → 30s, "2h" → 7200s
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
  tag:       'purge',
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
        text: `✦ *Uso del comando purge*\n\n` +
          `✦ Borrar últimos N mensajes:\n  *.purge 50*\n\n` +
          `✦ Borrar por tiempo:\n  *.purge 10m*  (últimos 10 minutos)\n  *.purge 30s*  (últimos 30 segundos)\n  *.purge 2h*   (últimas 2 horas)\n\n` +
          `✦ Máximo: 500 mensajes por operación.`
      }, { quoted: msg })
      return
    }

    const arg  = args[0].toLowerCase()
    let mensajes = []

    // Modo tiempo: 10m, 30s, 2h
    const secs = parseTime(arg)
    if (secs !== null) {
      mensajes = getMsgsSince(from, secs)
    } else {
      // Modo cantidad: número entero
      const n = parseInt(arg)
      if (isNaN(n) || n < 1) {
        await sock.sendMessage(from, {
          text: '⚠️ Argumento inválido. Usa un número (*.purge 50*) o tiempo (*.purge 10m*).'
        }, { quoted: msg })
        return
      }
      mensajes = getLastMsgs(from, Math.min(n, 500))
    }

    if (!mensajes.length) {
      await sock.sendMessage(from, {
        text: '✦ No hay mensajes registrados en ese rango.'
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
        // Pequeño delay para no saturar — evita baneo
        await new Promise(r => setTimeout(r, 150))
      } catch {
        fallidos++
      }
    }

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
    await sock.sendMessage(from, {
      text: `✦ Purge completado.\n✦ Eliminados: *${eliminados}*${fallidos ? `\n✦ No eliminados: *${fallidos}* (mensajes muy antiguos o sin permisos)` : ''}`
    }, { quoted: msg })
  }
}