import { writeFileSync } from 'fs'
import { resolve }       from 'path'

export default {
  command:   'setimg',
  tag:       'setimg',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Cambia la imagen por defecto del bot',

  async execute(sock, msg, { from, args }) {
    const url = args[0]
    if (!url) {
      await sock.sendMessage(from, { text: '🖼 Uso: *.setimg <url>*' }, { quoted: msg })
      return
    }
    global.bot.defaultImg = url
    const body = `const bot = ${JSON.stringify(global.bot, null, 2)}\n\nglobal.bot = bot\nexport default bot\n`
    writeFileSync(resolve('settings/bot.js'), body, 'utf8')
    await sock.sendMessage(from, { text: global.messages.imageChanged }, { quoted: msg })
  }
}