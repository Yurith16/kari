// plugins/reaccion_anal.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['anal'],
  tag:       'anal',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Reacción NSFW intensa',

  async execute(sock, msg, { from, groupCfg }) {
    if (!groupCfg?.nsfw) {
      await sock.sendMessage(from, { text: '⚠️ Este grupo no tiene activado el contenido NSFW.' }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔞', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/anal`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]
      
      const mentions = [selfJid]
      let victima = null

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const textMentions = fullText.match(/@(\d+)/g) || []
      
      if (quotedParticipant) {
        victima = await getRealJid(sock, quotedParticipant, msg)
      } 
      else if (mentionedJids.length > 0) {
        victima = await getRealJid(sock, mentionedJids[0], msg)
      } 
      else if (textMentions.length > 0) {
        const num = textMentions[0].replace('@', '')
        victima = `${num}@s.whatsapp.net`
      }

      let txt = ''
      
      if (victima && victima !== selfJid) {
        mentions.push(victima)
        const victimTag = victima.split('@')[0]
        
        const frasesPareja = [
          `🔞 @${selfTag} agarró a @${victimTag} y le dio como si no hubiera un mañana. ¡Pobre @${victimTag}, no va a poder ni sentarse!`,
          `😈 @${selfTag} se puso modo animal con @${victimTag}. ¡Se lo/la está estirando hasta el alma sin piedad!`,
          `💦 @${selfTag} tiene a @${victimTag} rogando por aire y gimiendo... ¡qué salvajada se están dando en esa cama!`,
          `🔥 @${selfTag} no tiene compasión alguna, está dejando a @${victimTag} viendo estrellas del puro castigo.`,
          `🍑 @${selfTag} tomó el control absoluto por completo y destrozó la retaguardia de @${victimTag} en un segundo.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🔞 @${selfTag} anda con una calentura desatada que nadie le quita, ¡se va a romper a sí mismo/a del vicio!`,
          `😈 @${selfTag} busca urgentemente quién se atreva a aguantar semejante castigo. ¿Quién se apunta a la perversión?`,
          `🥵 @${selfTag} está en su modo más cochino e insaciable, ¡va a dejar las sábanas hechas un desastre total!`,
          `💦 @${selfTag} se está dando un banquete a solas, ¡esto es puro exhibicionismo, degeneración y descontrol!`,
          `💥 @${selfTag} no encuentra con quién desquitarse y la lujuria lo está volviendo loco frente a la pantalla.`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages?.error || '⚠️ Ocurrió un error.' }, { quoted: msg })
    }
  }
}