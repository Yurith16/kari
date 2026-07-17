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
  command:     'purgar',
  tag:         'purgar',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Borrar mensajes de forma manual',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    if (!args.length) {
      await sock.sendMessage(from, { text: 'no soy adivina, necesito saber cuántos mensajes o cuánto tiempo atrás voy a borrar.' }, { quoted: msg })
      return
    }

    const arg  = args[0].toLowerCase()
    let mensajes = []

    // 1. Intentamos obtenerlos desde la base de datos local
    const secs = parseTime(arg)
    if (secs !== null) {
      mensajes = getMsgsSince(from, secs)
    } else {
      const n = parseInt(arg)
      if (isNaN(n) || n < 1) {
        await sock.sendMessage(from, { text: 'no entiendo eso, pon una cantidad válida o tiempo.' }, { quoted: msg })
        return
      }
      mensajes = getLastMsgs(from, Math.min(n, 500))
    }

    // 2. RESPALDO INTELIGENTE: Si tienes implementado sock.store, jalamos los mensajes reales del chat 
    // para incluir los del bot que la base de datos ignora.
    if (global.store?.messages?.[from]) {
      const storeMsgs = global.store.messages[from].array.slice(-Math.min(parseInt(arg) || 100, 500))
      storeMsgs.forEach(sm => {
        if (!sm.key?.id) return
        // Si no está en la lista obtenida de la DB, lo agregamos manualmente
        if (!mensajes.some(m => m.msg_id === sm.key.id)) {
          mensajes.push({
            msg_id: sm.key.id,
            sender: sm.key.participant || sm.participant || (sm.key.fromMe ? sock.user?.id : ''),
            from_me: sm.key.fromMe ? 1 : 0
          })
        }
      })
    }

    if (!mensajes.length) {
      await sock.sendMessage(from, { text: 'no encontré nada para borrar en ese rango.' }, { quoted: msg })
      return
    }

    let eliminados = 0
    const myNumber = sock.user?.id ? sock.user.id.split(':')[0].split('@')[0] : null

    for (const m of mensajes) {
      try {
        const senderNumber = m.sender ? m.sender.split(':')[0].split('@')[0] : ''
        // Es nuestro si coincide el número o si el objeto venía marcado como from_me
        const isMe = (myNumber && senderNumber === myNumber) || m.from_me === 1

        await sock.sendMessage(from, {
          delete: {
            remoteJid:   from,
            fromMe:      isMe ? true : false,
            id:          m.msg_id,
            participant: isMe ? undefined : m.sender
          }
        })
        deleteMsgFromHistory(from, m.msg_id)
        eliminados++
        await new Promise(r => setTimeout(r, 150))
      } catch {
        // Ignora errores si ya se borraron manualmente
      }
    }

    await sock.sendMessage(from, { text: `ya limpié el chat, borré ${eliminados} mensajes.` }, { quoted: msg })
  }
}