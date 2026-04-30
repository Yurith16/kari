export default {
  command:   'abrir',
  tag:       'abrir (abre grupo)',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    try {
      await sock.groupSettingUpdate(from, 'not_announcement')
      await sock.sendMessage(from, { text: global.messages.groupOpened }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}