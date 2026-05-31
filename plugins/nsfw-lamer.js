// plugins/reaccion_chupar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['chupar', 'pussylick', 'lamer'],
  tag:       'lamer',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Reacción NSFW de lamer coño',

  async execute(sock, msg, { from, groupCfg }) {
    // Verificación de configuración del grupo para contenido NSFW
    if (!groupCfg?.nsfw) {
      await sock.sendMessage(from, { text: '⚠️ Este grupo no tiene activado el contenido NSFW.' }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '👅', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/pussylick`
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
          `👅 @${selfTag} se está dando un banquete con @${victimTag}, ¡esto se puso muy húmedo!`,
          `😈 @${selfTag} no deja ni un espacio sin explorar de @${victimTag}, ¡qué nivel de placer!`,
          `💦 @${selfTag} está dejando a @${victimTag} temblando de puro gusto.`,
          `🔥 @${selfTag} sabe exactamente dónde tocar a @${victimTag}, ¡el ambiente está que arde!`
        ]
        txt = frases[Math.floor(Math.random() * frases.length)]
      } else {
        const frasesSolo = [
          `👅 @${selfTag} tiene un hambre insaciable, ¡esto es puro vicio!`,
          `😈 @${selfTag} anda buscando dónde descargar toda esa calentura.`,
          `🥵 @${selfTag} está en su modo más salvaje, ¡necesita acción inmediata!`
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