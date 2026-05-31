export default {
  command:   ['desc', 'description', 'descripcion', 'setdesc'],
  tag:       'desc',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Cambia la descripción del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const desc = args.join(' ')
    if (!desc) {
      await sock.sendMessage(from, {
        text: '🌸 Dime qué descripción quieres poner.\n\n_Ejemplo: .desc Bienvenidos al paraíso_'
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