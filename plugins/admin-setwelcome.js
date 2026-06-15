// plugins/setwelcome.js
import { setGroupField } from '../core/sqlite.js'

export default {
  command: ['setwelcome', 'setbienvenida'],
  tag: 'setwelcome',
  categoria: 'admin',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Personaliza el mensaje de bienvenida del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    // Capturar el texto completo con saltos de línea
    const fullText = msg.message?.extendedTextMessage?.text || msg.message?.conversation || ''
    const commandName = args[0] ? fullText.slice(0, fullText.indexOf(args[0])).trim() : fullText.split(' ')[0]
    const texto = fullText.slice(commandName.length).trim()

    if (!texto) {
      await sock.sendMessage(from, {
        text: `🌸 *Personalizar bienvenida*\n\n.setwelcome 🌿 Bienvenida, @user.\n\nPara borrar: .delwelcome`
      }, { quoted: msg })
      return
    }

    setGroupField(from, 'welcomeText', texto)

    await sock.sendMessage(from, {
      text: `🌸 Listo, ya quedó tu bienvenida. 🌿\n\n${texto}`
    }, { quoted: msg })
  }
}