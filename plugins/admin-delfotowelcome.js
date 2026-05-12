import { setGroupField } from '../core/sqlite.js'
import { existsSync, unlinkSync } from 'fs'

export default {
  command:     'delfotowelcome',
  alias:       'delfwelcome',
  tag:         'welcome',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Elimina la imagen personalizada de bienvenida y usa la predeterminada',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const imgUrl = groupCfg?.welcomeImg || ''

      if (imgUrl.startsWith('file://')) {
        const filePath = imgUrl.replace('file://', '')
        if (existsSync(filePath)) {
          unlinkSync(filePath)
        }
      }

      setGroupField(from, 'welcomeImg', '')

      await sock.sendMessage(from, {
        text: '👋 Imagen de bienvenida eliminada.\n\n🌸 Ahora usaré la que traigo por defecto.'
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}