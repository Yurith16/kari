import { setGroupField } from '../core/sqlite.js'

export default {
  command:     ['delbye'],
  tag:         'delbye',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Elimina el mensaje personalizado de despedida',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    setGroupField(from, 'goodbyeText', '')
    await sock.sendMessage(from, { text: global.messages?.goodbyeDel }, { quoted: msg })
  }
}