export default {
  command:   'hidetag',
  tag:       'tag (mencionar a todos)',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    try {
      const meta     = await sock.groupMetadata(from)
      const mentions = meta.participants.map(m => m.id)
      const texto    = args.join(' ') || '👀'
      await sock.sendMessage(from, { text: texto, mentions })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}