// plugins/pendejo.js

import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['pendeja', 'pendejo', 'pndjo'],
  tag:       'pendejo',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de pendeja',

  async execute(sock, msg, { from, args }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1).toLowerCase() || 'pendejo'
    const esFemenino = usedCommand === 'pendeja'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🤪', key: msg.key } })

    try {
      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        if (esFemenino) {
          txt = `🤪 @${selfTag} dice que @${victimTag} es bien pendeja... ¡aguas con las burlas! 💅`
        } else {
          txt = `🤪 @${selfTag} dice que @${victimTag} es bien pendejo... ¡aguas con las burlas!`
        }
        mentions.push(victimJid)
      } else {
        if (esFemenino) {
          const frasesRandom = [
            `💅 @${selfTag} anda en modo pendeja hoy, ¿quién le baja?`,
            `🤪 @${selfTag} hizo una pendejada tan grande que hasta le aplaudieron.`,
            `🤡 @${selfTag} se declaró oficialmente la pendeja del grupo.`,
            `😂 @${selfTag} está haciendo cada pendejada, ¡ya ubícate!`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        } else {
          const frasesRandom = [
            `🤪 @${selfTag} anda en modo pendejo hoy, ¿quién le baja?`,
            `😂 @${selfTag} hizo una pendejada tan grande que hasta le aplaudieron.`,
            `🤡 @${selfTag} se declaró oficialmente el pendejo del grupo.`,
            `👏 @${selfTag} está haciendo cada pendejada, ¡ya ubícate!`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        }
      }

      const gifPath = join(process.cwd(), 'media', 'pendejo.mp4')
      const gifBuffer = readFileSync(gifPath)

      const enviado = await sock.sendMessage(from, {
        video: gifBuffer,
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}