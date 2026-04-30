import { writeFileSync } from 'fs'
import { resolve }       from 'path'

export default {
  command:   'setowner',
  tag:       'setowner',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const num = args[0]?.replace(/\D/g, '')
    if (!num) {
      await sock.sendMessage(from, { text: `👑 Owner actual: *${global.bot.ownerNumber}*\nUso: *.setowner <número>*` }, { quoted: msg })
      return
    }
    global.bot.ownerNumber = num
    const body = `const bot = ${JSON.stringify(global.bot, null, 2)}\n\nglobal.bot = bot\nexport default bot\n`
    writeFileSync(resolve('settings/bot.js'), body, 'utf8')
    await sock.sendMessage(from, { text: global.messages.ownerChanged }, { quoted: msg })
  }
}