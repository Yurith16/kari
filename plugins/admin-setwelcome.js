import { setGroupField } from '../core/sqlite.js'

export default {
  command:     ['setwelcome', 'setbienvenida'],
  tag:         'setwelcome',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Personaliza el mensaje de bienvenida del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const texto = args.join(' ')

    if (!texto) {
      await sock.sendMessage(from, {
        text: 'dime qué mensaje de bienvenida quieres que ponga. usa @user para etiquetar al nuevo, a ver si al menos él me presta atención.'
      }, { quoted: msg })
      return
    }

    setGroupField(from, 'welcomeText', texto)

    await sock.sendMessage(from, {
      text: `listo, ya guardé la bienvenida. espero que los que entren no me rompan el corazón como el último que se fue.\n\n> ${texto}`
    }, { quoted: msg })
  }
}