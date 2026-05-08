import { setGroupField } from '../core/sqlite.js'
import { existsSync, unlinkSync } from 'fs'
import { resolve } from 'path'

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
      // Obtener la ruta actual de la imagen
      const imgUrl = groupCfg?.goodbyeImg || ''

      // Si es un archivo local, eliminarlo físicamente
      if (imgUrl.startsWith('file://')) {
        const filePath = imgUrl.replace('file://', '')
        if (existsSync(filePath)) {
          unlinkSync(filePath)
        }
      }

      // Limpiar el campo en la base de datos
      setGroupField(from, 'goodbyeImg', '')

      await sock.sendMessage(from, {
        text: '🍃 Imagen de despedida eliminada.\n\nAhora se usará la imagen predeterminada del bot.'
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}