import { setGroupField } from '../core/sqlite.js'

export default {
  command:   'goodbye',
  tag:       'goodbye',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg, prefix }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const fullText = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text || ''
    )

    const cmdLine   = fullText.split('\n')[0]
    const firstLine = cmdLine.replace(/^[^\s]+\s*/, '')
    const resto     = fullText.split('\n').slice(1).join('\n')
    const texto     = (firstLine + (resto ? '\n' + resto : '')).trim()

    if (texto) {
      setGroupField(from, 'goodbyeText', texto)
      await sock.sendMessage(from, {
        text: `🍃 Mensaje de despedida actualizado:\n\n${texto}`
      }, { quoted: msg })
      return
    }

    const estado = groupCfg?.goodbyeMsg
    setGroupField(from, 'goodbyeMsg', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.goodbyeOff : global.messages.goodbyeOn
    }, { quoted: msg })
  }
}