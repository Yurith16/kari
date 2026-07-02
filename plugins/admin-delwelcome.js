import { setGroupField } from '../core/sqlite.js'

export default {
  command:     ['delwelcome'],
  tag:         'delwelcome',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Elimina el mensaje personalizado de bienvenida',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    setGroupField(from, 'welcomeText', '')
    await sock.sendMessage(from, { text: global.messages?.welcomeDel }, { quoted: msg })
  }
}