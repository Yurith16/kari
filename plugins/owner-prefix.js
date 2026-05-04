import { writeFileSync } from 'fs'
import { resolve }       from 'path'

export default {
  command:   'prefix',
  tag:       'prefix',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Cambia el prefijo del bot',

  async execute(sock, msg, { from, args }) {
    const np = args[0]
    if (!np) {
      await sock.sendMessage(from, { text: `💬 Prefijo actual: *${global.bot.prefix.join(' ')}*\nUso: *.prefix <nuevo>*` }, { quoted: msg })
      return
    }
    global.bot.prefix = [np]
    const body = `const bot = ${JSON.stringify(global.bot, null, 2)}\n\nglobal.bot = bot\nexport default bot\n`
    writeFileSync(resolve('settings/bot.js'), body, 'utf8')
    await sock.sendMessage(from, {
      text: global.messages.prefixChanged.replace('{prefix}', np)
    }, { quoted: msg })
  }
}