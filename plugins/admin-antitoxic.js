// plugins/antitoxic.js

import { setGroupField } from '../core/sqlite.js'

export default {
  command:     'antitoxic',
  tag:         'antitoxic',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Activa o desactiva el detector de insultos',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      return sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
    }

    const estado = groupCfg?.antiToxic === 0 ? false : true
    setGroupField(from, 'antiToxic', estado ? 0 : 1)

    await sock.sendMessage(from, {
      text: estado
        ? '🌸 El detector de insultos está *desactivado*.'
        : '🛡 El detector de insultos está *activado*. Cuidado con las palabras, Midori está atenta.'
    }, { quoted: msg })
  }
}