import { setGroupField } from '../core/sqlite.js'

export default {
  command:   'goodbye',
  tag:       'goodbye',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'activa/desactiva y Configura el mensaje de despedida del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const texto = args.join(' ')
    if (texto) {
      setGroupField(from, 'goodbyeText', texto)
      await sock.sendMessage(from, { text: `🍃 Mensaje de despedida actualizado:\n\n${texto}` }, { quoted: msg })
      return
    }
    const estado = groupCfg?.goodbyeMsg
    setGroupField(from, 'goodbyeMsg', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.goodbyeOff : global.messages.goodbyeOn
    }, { quoted: msg })
  }
}