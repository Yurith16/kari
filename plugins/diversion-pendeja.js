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
          txt = `*¡Qué pendeja!* @${selfTag} está diciendo que @${victimTag} es bien pendeja... ¡Aguas con las burlas, amiga! 🤪💅😂`
        } else {
          txt = `*¡Qué pendejo!* @${selfTag} está diciendo que @${victimTag} es bien pendejo... ¡Aguas con las burlas, compa! 🤪😂`
        }
        mentions.push(victimJid)
      } else {
        if (esFemenino) {
          const frasesRandom = [
            `*¡Se pasó de lanza!* @${selfTag} está haciendo cada pendejada... ¡Ya ubícate, amiga! 🤪💅`,
            `@${selfTag} anda en modo pendeja hoy... ¿Quién le baja a esa morra? 😂`,
            `*Sin contexto:* @${selfTag} se declaró oficialmente la pendeja del grupo. 🤡💋`,
            `@${selfTag} hizo una pendejada tan grande que hasta le aplaudieron. 👏🤪`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        } else {
          const frasesRandom = [
            `*¡Se pasó de lanza!* @${selfTag} está haciendo cada pendejada... ¡Ya ubícate, compa! 🤪`,
            `@${selfTag} anda en modo pendejo hoy... ¿Quién le baja a ese wey? 😂`,
            `*Sin contexto:* @${selfTag} se declaró oficialmente el pendejo del grupo. 🤡`,
            `@${selfTag} hizo una pendejada tan grande que hasta le aplaudieron. 👏🤪`
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

      if (enviado) {
        await sock.sendMessage(from, { react: { text: targetJid ? '😂' : '🤡', key: enviado.key } })
      }

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}