export default {
  command:   'tag',
  tag:       'tag',
  categoria: 'main',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Menciona a todos sin hacer spam',

  async execute(sock, msg, { from, args }) {
    try {
      const meta     = await sock.groupMetadata(from)
      const mentions = meta.participants.map(m => m.id)

      // Si responde a un mensaje, copiar el texto de ese mensaje
      const quoted = msg.message?.extendedTextMessage?.contextInfo
      if (quoted?.quotedMessage) {
        const quotedText = quoted.quotedMessage?.conversation ||
                          quoted.quotedMessage?.extendedTextMessage?.text ||
                          quoted.quotedMessage?.imageMessage?.caption ||
                          quoted.quotedMessage?.videoMessage?.caption ||
                          ''
        if (quotedText) {
          await sock.sendMessage(from, { text: quotedText, mentions })
          return
        }
      }

      // Si no responde, usar el texto o un mensaje lindo por defecto
      const texto = args.join(' ') || '🌸 Hola a todos, los llamaron de su grupo favorito.'
      await sock.sendMessage(from, { text: texto, mentions })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}