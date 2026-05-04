export default {
  command:   'tag',
  tag:       'tag',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Menciona a todos sin hacer spam',

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