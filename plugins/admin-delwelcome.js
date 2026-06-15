// plugins/delwelcome.js
import { setGroupField } from '../core/sqlite.js'

export default {
  command: ['delwelcome', 'delbienvenida'],
  tag: 'delwelcome',
  categoria: 'admin',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Elimina el mensaje personalizado de bienvenida',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    setGroupField(from, 'welcomeText', '')
    await sock.sendMessage(from, {
      text: `🌸 Bienvenida eliminada. Ahora usará la que traigo por defecto. 🌿`
    }, { quoted: msg })
  }
}