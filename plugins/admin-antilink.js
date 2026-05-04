import { setGroupField } from '../core/sqlite.js'

export default {
  command:   'antilink',
  tag:       'antilink',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Activa o desactiva el antilink en el grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const estado = groupCfg?.antiLink
    setGroupField(from, 'antiLink', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.antilinkOff : global.messages.antilinkOn
    }, { quoted: msg })
  }
}