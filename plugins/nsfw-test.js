export default {
  command:   'test',
  tag:       'test',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, {
      text: global.messages?.nsfwOn
    }, { quoted: msg })
  }
}