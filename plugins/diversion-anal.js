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
    // Verificación de configuración del grupo
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
      let victimas = []

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const textMentions = fullText.match(/@(\d+)/g) || []
      
      if (quotedParticipant) {
        const victimJid = await getRealJid(sock, quotedParticipant, msg)
        victimas.push(victimJid)
        mentions.push(victimJid)
      }
      
      for (const jid of mentionedJids) {
        if (victimas.length >= 2) break
        const victimJid = await getRealJid(sock, jid, msg)
        if (!victimas.some(v => v === victimJid)) {
          victimas.push(victimJid)
          mentions.push(victimJid)
        }
      }
      
      for (const match of textMentions) {
        if (victimas.length >= 2) break
        const num = match.replace('@', '')
        const victimJid = `${num}@s.whatsapp.net`
        if (!victimas.some(v => v === victimJid)) {
          victimas.push(victimJid)
          mentions.push(victimJid)
        }
      }

      let txt = ''
      
      if (victimas.length === 1) {
        const victimTag = victimas[0].split('@')[0]
        const frases1 = [
          `🔞 @${selfTag} agarró a @${victimTag} y le dio como si no hubiera un mañana. ¡Pobre @${victimTag}, no va a poder ni sentarse!`,
          `😈 @${selfTag} se puso modo animal con @${victimTag}. ¡Se lo/la está estirando hasta el alma!`,
          `💦 @${selfTag} tiene a @${victimTag} rogando piedad... ¡qué salvajada se están dando!`,
          `🔥 @${selfTag} no tiene piedad, está dejando a @${victimTag} viendo estrellas.`
        ]
        txt = frases1[Math.floor(Math.random() * frases1.length)]
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        txt = `🔥 @${selfTag} está haciendo un banquete con @${victim1Tag} y @${victim2Tag}. ¡Esto es una orgía de descontrol total, los está dejando secos! 🔞`
      }
      else {
        const frasesRandom = [
          `🔞 @${selfTag} anda con una calentura que no se la quita nadie, ¡se va a romper a sí mismo/a!`,
          `😈 @${selfTag} busca quién se atreva a aguantar semejante tamaño. ¿Quién se apunta al castigo?`,
          `🥵 @${selfTag} está en su modo más cochino, ¡va a dejar la cama hecha trizas!`,
          `💦 @${selfTag} se está dando un banquete solo/a, ¡esto es puro vicio y degeneración!`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
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