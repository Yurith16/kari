export default {
  command:   'desc',
  tag:       'desc (descripcion)',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const desc = args.join(' ')
    if (!desc) {
      await sock.sendMessage(from, { text: '✏️ Uso: *.desc <nueva descripción>*' }, { quoted: msg })
      return
    }
    try {
      await sock.groupUpdateDescription(from, desc)
      await sock.sendMessage(from, { text: global.messages.groupDescChanged }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}