import { setGroupField } from '../core/sqlite.js'

export default {
  command:   'nsfw',
  tag:       'nsfw',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Activa o desactiva el contenido +18 en el grupo',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const estado = groupCfg?.nsfw
    setGroupField(from, 'nsfw', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.nsfwOff : global.messages.nsfwOn
    }, { quoted: msg })
  }
}