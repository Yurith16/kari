import { setGroupField } from '../core/sqlite.js'
import { existsSync, unlinkSync } from 'fs'

export default {
  command:     'delfotoadios',
  alias:       'delfgoodbye',
  tag:         'goodbye',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Elimina la imagen personalizada de despedida y usa la predeterminada',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const imgUrl = groupCfg?.goodbyeImg || ''

      if (imgUrl.startsWith('file://')) {
        const filePath = imgUrl.replace('file://', '')
        if (existsSync(filePath)) {
          unlinkSync(filePath)
        }
      }

      setGroupField(from, 'goodbyeImg', '')

      await sock.sendMessage(from, {
        text: '🍃 Imagen de despedida eliminada.\n\n🌸 Ahora usaré la imagen que traigo por defecto.'
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}