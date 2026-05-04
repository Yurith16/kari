import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  command:   'foto',
  tag:       'foto',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Cambia la foto del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const imgMsg = quoted?.imageMessage ? { message: quoted } : (msg.message?.imageMessage ? msg : null)
    if (!imgMsg) {
      await sock.sendMessage(from, { text: '🖼 Responde a una imagen para cambiar la foto del grupo.' }, { quoted: msg })
      return
    }
    try {
      const buffer = await downloadMediaMessage(imgMsg, 'buffer', {})
      await sock.updateProfilePicture(from, buffer)
      await sock.sendMessage(from, { text: global.messages.groupPhotoChanged }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}