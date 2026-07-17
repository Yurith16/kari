import { setGroupField } from '../core/sqlite.js'

export default {
  command:     ['setgoodbye', 'setbye', 'setdespedida'],
  tag:         'setbye',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Personaliza el mensaje de despedida del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const texto = args.join(' ')

    if (!texto) {
      await sock.sendMessage(from, {
        text: 'dime qué mensaje de despedida quieres que ponga. puedes usar @user para que lo etiquete cuando se vaya.'
      }, { quoted: msg })
      return
    }

    setGroupField(from, 'goodbyeText', texto)

    await sock.sendMessage(from, {
      text: `listo, ya guardé la despedida. espero que no se vayan muchos, qué deprimente.\n\n> ${texto}`
    }, { quoted: msg })
  }
}