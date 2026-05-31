// plugins/reaccion_fuck.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['fuck', 'follar', 'coger'],
  tag:       'follar',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Reacción NSFW de sexo',

  async execute(sock, msg, { from, groupCfg }) {
    // Verificación de configuración del grupo para contenido NSFW
    if (!groupCfg?.nsfw) {
      await sock.sendMessage(from, { text: '⚠️ Este grupo no tiene activado el contenido NSFW.' }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔥', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/fuck`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]
      
      const mentions = [selfJid]
      let victimas = []

      // Obtener víctimas del contexto
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      
      if (quotedParticipant) {
        const victimJid = await getRealJid(sock, quotedParticipant, msg)
        victimas.push(victimJid)
        mentions.push(victimJid)
      }
      
      for (const jid of mentionedJids) {
        if (victimas.length >= 1) break
        const victimJid = await getRealJid(sock, jid, msg)
        if (!victimas.some(v => v === victimJid)) {
          victimas.push(victimJid)
          mentions.push(victimJid)
        }
      }

      let txt = ''
      if (victimas.length === 1) {
        const victimTag = victimas[0].split('@')[0]
        const frases = [
          `🔞 @${selfTag} está dándole con todo a @${victimTag}, ¡esto se puso muy intenso!`,
          `😈 @${selfTag} y @${victimTag} están en plena acción, ¡la temperatura subió al máximo!`,
          `💦 @${selfTag} no tiene piedad con @${victimTag}, ¡qué salvajada se están dando!`,
          `🔥 @${selfTag} dejó a @${victimTag} sin aliento en este encuentro prohibido.`
        ]
        txt = frases[Math.floor(Math.random() * frases.length)]
      } else {
        const frasesSolo = [
          `🔞 @${selfTag} está buscando con quién descontrolarse, ¿alguien se apunta?`,
          `😈 @${selfTag} tiene una calentura que no puede aguantar, ¡necesita acción ya!`,
          `🥵 @${selfTag} está en su modo más salvaje, ¡esto es puro vicio!`
        ]
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}