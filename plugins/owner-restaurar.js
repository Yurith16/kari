import { copyFileSync, existsSync } from 'fs'
import { resolve }                  from 'path'

export default {
  command:   'restaurar',
  tag:       'restaurar',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const file = args[0]
    if (!file) {
      await sock.sendMessage(from, { text: '💾 Uso: *.restaurar <nombre-backup.db>*' }, { quoted: msg })
      return
    }
    const src = resolve(file)
    if (!existsSync(src)) {
      await sock.sendMessage(from, { text: global.messages.restoreFail }, { quoted: msg })
      return
    }
    try {
      copyFileSync(src, resolve('midori.db'))
      await sock.sendMessage(from, { text: global.messages.restoreDone }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.restoreFail }, { quoted: msg })
    }
  }
}