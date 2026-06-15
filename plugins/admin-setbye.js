// plugins/setgoodbye.js
import { setGroupField } from '../core/sqlite.js'

export default {
  command: ['setgoodbye', 'setbye', 'setdespedida'],
  tag: 'setbye',
  categoria: 'admin',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Personaliza el mensaje de despedida del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const fullText = msg.message?.extendedTextMessage?.text || msg.message?.conversation || ''
    const commandName = args[0] ? fullText.slice(0, fullText.indexOf(args[0])).trim() : fullText.split(' ')[0]
    const texto = fullText.slice(commandName.length).trim()

    if (!texto) {
      await sock.sendMessage(from, {
        text: `🌸 *Personalizar despedida*\n\n.setgoodbye 🌿 Adiós, @user.\n\nPara borrar: .delgoodbye`
      }, { quoted: msg })
      return
    }

    setGroupField(from, 'goodbyeText', texto)

    await sock.sendMessage(from, {
      text: `🌸 Listo, ya quedó tu despedida. 🌿\n\n${texto}`
    }, { quoted: msg })
  }
}