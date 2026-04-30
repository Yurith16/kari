import { setGroupField } from '../core/sqlite.js'

export default {
  command:   'welcome',
  tag:       'welcome',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    // Si hay texto después del comando, actualiza el mensaje personalizado
    const texto = args.join(' ')
    if (texto) {
      setGroupField(from, 'welcomeText', texto)
      await sock.sendMessage(from, { text: `👋 Mensaje de bienvenida actualizado:\n\n${texto}` }, { quoted: msg })
      return
    }
    const estado = groupCfg?.welcomeMsg
    setGroupField(from, 'welcomeMsg', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.welcomeOff : global.messages.welcomeOn
    }, { quoted: msg })
  }
}