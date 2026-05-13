import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['besar', 'kiss'],
  tag:       'besar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de besos',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '💋', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/kiss`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `💋 ¡El amor está en el aire! @${selfTag} le dio un beso a @${victimTag}... ❤️`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `💋 @${selfTag} está lanzando besos a todo el mundo, ¡cuidado que enamora!`,
          `✨ @${selfTag} anda cariñoso hoy, repartiendo besos por todos lados.`,
          `🌹 @${selfTag} mandó un beso volador, ¿alguien lo atrapó?`,
          `💖 @${selfTag} se puso romántico y soltó besos al aire.`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      const enviado = await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}