import { copyFileSync } from 'fs'
import { resolve }      from 'path'

export default {
  command:   'backup',
  tag:       'backup',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    try {
      const dest = resolve(`midori-backup-${Date.now()}.db`)
      copyFileSync(resolve('midori.db'), dest)
      await sock.sendMessage(from, {
        text: `${global.messages.backupDone}\n📁 ${dest}`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}