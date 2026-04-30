// plugins/link.js

export default {
  command:   'link',
  tag:       'link (url del grupo)',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const code = await sock.groupInviteCode(from)
      await sock.sendMessage(from, {
        text: `✦ Enlace del grupo:\nhttps://chat.whatsapp.com/${code}`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, {
        text: '✦ No se pudo obtener el enlace del grupo.'
      }, { quoted: msg })
    }
  }
}