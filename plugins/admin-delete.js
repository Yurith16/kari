export default {
  command:   'delete',
  tag:       'delete',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Elimina un mensaje del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const ctx = msg.message?.extendedTextMessage?.contextInfo
    if (!ctx?.stanzaId) {
      await sock.sendMessage(from, { text: global.messages.replyNeeded }, { quoted: msg })
      return
    }
    try {
      // Eliminar el mensaje citado
      await sock.sendMessage(from, {
        delete: {
          remoteJid:   from,
          fromMe:      false,
          id:          ctx.stanzaId,
          participant: ctx.participant
        }
      })
      // Eliminar también el mensaje del bot que ejecutó el comando
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe:    true,
          id:        msg.key.id
        }
      })
    } catch {
      await sock.sendMessage(from, { text: global.messages.deleteFail }, { quoted: msg })
    }
  }
}