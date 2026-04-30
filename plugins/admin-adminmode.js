import { setGroupField } from '../core/sqlite.js'

export default {
  command:   'adminmode',
  tag:       'adminmode (solo a adm)',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const estado = groupCfg?.adminMode
    setGroupField(from, 'adminMode', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.adminModeOff : global.messages.adminModeOn
    }, { quoted: msg })
  }
}