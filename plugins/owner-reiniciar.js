export default {
  command:   'reiniciar',
  tag:       'reiniciar',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { text: global.messages.botRestart }, { quoted: msg })
    setTimeout(() => process.exit(1), 1500)
  }
}