export default {
  command:   ['desc', 'description', 'descripcion', 'setdesc'],
  tag:       'setdesc',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Cambia la descripción del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '📝', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const desc = args.join(' ')
    if (!desc) {
      await sock.sendMessage(from, {
        text: '_Dime qué descripción quieres poner._'
      }, { quoted: msg })
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