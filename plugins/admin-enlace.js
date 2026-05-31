// plugins/link.js

export default {
  command:   ['link', 'enlace', 'invite', 'invitacion'],
  tag:       'link',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Muestra el enlace de invitación del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const code = await sock.groupInviteCode(from)
      await sock.sendMessage(from, {
        text: `🔗 Aquí tienes el enlace, compártelo con cuidado:\nhttps://chat.whatsapp.com/${code}`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}