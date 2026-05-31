// plugins/reaccion_cum.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['cum', 'leche'],
  tag:       'cum',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Reacción NSFW de cum',

  async execute(sock, msg, { from, groupCfg }) {
    // Verificación de configuración del grupo para contenido NSFW
    if (!groupCfg?.nsfw) {
      await sock.sendMessage(from, { text: '⚠️ Este grupo no tiene activado el contenido NSFW.' }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '💦', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cum`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]
      
      const mentions = [selfJid]
      let victimas = []

      // Obtener víctimas del contexto (etiquetados o respondidos)
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
          `💦 @${selfTag} no pudo aguantar más y cubrió por completo a @${victimTag}! ¡Qué desastre tan excitante!`,
          `😈 @${selfTag} dejó a @${victimTag} totalmente empapado/a, ¡esto se salió de control!`,
          `🔥 @${selfTag} soltó todo sobre @${victimTag}, ¡la intensidad está al máximo!`,
          `🔞 @${selfTag} perdió el control con @${victimTag}, ¡una escena digna de una película de adultos!`
        ]
        txt = frases[Math.floor(Math.random() * frases.length)]
      } else {
        const frasesSolo = [
          `💦 @${selfTag} se liberó por completo, ¡qué nivel de descarga!`,
          `😈 @${selfTag} está fuera de sí, ¡una demostración de puro poder!`,
          `🥵 @${selfTag} no pudo contenerse más, ¡todo un espectáculo!`
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