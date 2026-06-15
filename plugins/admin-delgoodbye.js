// plugins/delgoodbye.js
import { setGroupField } from '../core/sqlite.js'

export default {
  command: ['delgoodbye', 'delbye', 'deldespedida'],
  tag: 'delgoodbye',
  categoria: 'admin',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Elimina el mensaje personalizado de despedida',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    setGroupField(from, 'goodbyeText', '')
    await sock.sendMessage(from, {
      text: `🌸 Despedida eliminada. Ahora usará la que traigo por defecto. 🌿`
    }, { quoted: msg })
  }
}