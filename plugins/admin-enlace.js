export default {
  command:   ['link', 'enlace', 'invite', 'invitacion'],
  tag:       'link',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Muestra el enlace de invitación del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '🔗', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const code = await sock.groupInviteCode(from)
      await sock.sendMessage(from, {
        text: `_Aquí tienes el enlace, compártelo con cuidado:_\nhttps://chat.whatsapp.com/${code}`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}