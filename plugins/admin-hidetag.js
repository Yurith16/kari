export default {
  command:   'tag',
  tag:       'tag',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Menciona a todos sin hacer spam',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    try {
      const meta     = await sock.groupMetadata(from)
      const mentions = meta.participants.map(m => m.id)

      // Si responde a un mensaje, reenviar ese mismo mensaje con menciones
      const quoted = msg.message?.extendedTextMessage?.contextInfo
      if (quoted?.quotedMessage) {
        await sock.sendMessage(from, {
          forward: {
            key: {
              remoteJid: from,
              id: quoted.stanzaId,
              participant: quoted.participant
            },
            message: quoted.quotedMessage
          },
          mentions
        })
        return
      }

      // Si no responde, usar el texto o un mensaje lindo por defecto
      const texto = args.join(' ') || '🌸 Hola a todos, los llamaron de su grupo favorito.'
      await sock.sendMessage(from, { text: texto, mentions })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}