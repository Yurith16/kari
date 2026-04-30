export default {
  command:   'apagar',
  tag:       'apagar',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { text: global.messages.botOff }, { quoted: msg })
    setTimeout(() => process.exit(0), 1500)
  }
}