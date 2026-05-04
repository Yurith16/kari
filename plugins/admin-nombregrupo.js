export default {
  command:   'nombre',
  tag:       'nombre',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Cambia el nombre del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const nombre = args.join(' ')
    if (!nombre) {
      await sock.sendMessage(from, { text: '✏️ Uso: *.nombre <nuevo nombre>*' }, { quoted: msg })
      return
    }
    try {
      await sock.groupUpdateSubject(from, nombre)
      await sock.sendMessage(from, { text: global.messages.groupNameChanged }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}