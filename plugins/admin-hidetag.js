import { downloadMediaMessage } from '@whiskeysockets/baileys'

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

      // Si responde a un mensaje
      const quoted = msg.message?.extendedTextMessage?.contextInfo
      if (quoted?.quotedMessage) {
        const qm = quoted.quotedMessage

        // Si es imagen
        if (qm.imageMessage) {
          const buffer = await downloadMediaMessage(
            { message: qm },
            'buffer',
            {}
          )
          await sock.sendMessage(from, {
            image: buffer,
            caption: qm.imageMessage.caption || '',
            mentions
          })
          return
        }

        // Si es video
        if (qm.videoMessage) {
          const buffer = await downloadMediaMessage(
            { message: qm },
            'buffer',
            {}
          )
          await sock.sendMessage(from, {
            video: buffer,
            caption: qm.videoMessage.caption || '',
            mentions
          })
          return
        }

        // Si es sticker
        if (qm.stickerMessage) {
          const buffer = await downloadMediaMessage(
            { message: qm },
            'buffer',
            {}
          )
          await sock.sendMessage(from, {
            sticker: buffer,
            mentions
          })
          return
        }

        // Si es texto
        const quotedText = qm.conversation ||
                          qm.extendedTextMessage?.text ||
                          qm.imageMessage?.caption ||
                          qm.videoMessage?.caption ||
                          ''
        if (quotedText) {
          await sock.sendMessage(from, { text: quotedText, mentions })
          return
        }
      }

      // Si no responde, usar el texto con saltos de línea respetados
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const cmdEnd = fullText.indexOf(' ')
      const texto = cmdEnd > -1 ? fullText.slice(cmdEnd + 1) : ''

      await sock.sendMessage(from, {
        text: texto || '🌸 Hola a todos, los llamaron de su grupo favorito.',
        mentions
      })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}