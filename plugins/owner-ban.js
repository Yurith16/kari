import { banUser, isBanned } from '../core/sqlite.js'

export default {
  command:   'ban',
  tag:       'ban',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const num = args[0]?.replace(/\D/g, '')
    if (!num) {
      await sock.sendMessage(from, { text: '🚫 Uso: *.ban <número>*' }, { quoted: msg })
      return
    }
    if (isBanned(num)) {
      await sock.sendMessage(from, { text: global.messages.banAlready }, { quoted: msg })
      return
    }
    banUser(num)
    await sock.sendMessage(from, { text: global.messages.banSuccess }, { quoted: msg })
  }
}