import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['besar', 'kiss', 'besito', 'beso'],
  tag:       'besar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de besos',

  async execute(sock, msg, { from }) {
    console.log('[BESAR] Iniciando comando')
    await sock.sendMessage(from, { react: { text: '💋', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/kiss`
      console.log('[BESAR] Solicitando a la API:', apiUrl)
      
      const { data: res } = await axios.get(apiUrl, { timeout: 15000 })
      console.log('[BESAR] Respuesta API:', JSON.stringify(res, null, 2))

      if (!res.status || !res.data) {
        console.log('[BESAR] API no devolvió status o data válida')
        throw new Error()
      }

      console.log('[BESAR] URL del video:', res.data.url)

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]
      console.log('[BESAR] Usuario:', selfTag)
      
      const mentions = [selfJid]
      let victimas = []

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const textMentions = fullText.match(/@(\d+)/g) || []
      
      console.log('[BESAR] quotedParticipant:', quotedParticipant)
      console.log('[BESAR] mentionedJids:', mentionedJids)
      console.log('[BESAR] textMentions:', textMentions)
      
      if (quotedParticipant) {
        const victimJid = await getRealJid(sock, quotedParticipant, msg)
        victimas.push(victimJid)
        mentions.push(victimJid)
        console.log('[BESAR] Víctima por respuesta:', victimJid)
      }
      
      for (const jid of mentionedJids) {
        if (victimas.length >= 2) break
        const victimJid = await getRealJid(sock, jid, msg)
        if (!victimas.some(v => v === victimJid)) {
          victimas.push(victimJid)
          mentions.push(victimJid)
          console.log('[BESAR] Víctima por mención:', victimJid)
        }
      }
      
      for (const match of textMentions) {
        if (victimas.length >= 2) break
        const num = match.replace('@', '')
        const victimJid = `${num}@s.whatsapp.net`
        if (!victimas.some(v => v === victimJid)) {
          victimas.push(victimJid)
          mentions.push(victimJid)
          console.log('[BESAR] Víctima por texto:', victimJid)
        }
      }

      let txt = ''
      
      if (victimas.length === 1) {
        const victimTag = victimas[0].split('@')[0]
        txt = `💋 ¡El amor está en el aire! @${selfTag} le dio un beso a @${victimTag}... ❤️`
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        txt = `💋 @${selfTag} repartió besos entre @${victim1Tag} y @${victim2Tag}. ¡Qué romántico! ❤️`
      }
      else {
        const frasesRandom = [
          `💋 @${selfTag} está lanzando besos a todo el mundo, ¡cuidado que enamora!`,
          `✨ @${selfTag} anda cariñoso hoy, repartiendo besos por todos lados.`,
          `🌹 @${selfTag} mandó un beso volador, ¿alguien lo atrapó?`,
          `💖 @${selfTag} se puso romántico y soltó besos al aire.`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      console.log('[BESAR] Mensaje final:', txt)
      console.log('[BESAR] Menciones:', mentions)
      console.log('[BESAR] Enviando video...')

      await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })
      
      console.log('[BESAR] Comando completado exitosamente')

    } catch (error) {
      console.error('[BESAR] Error:', error.message)
      if (error.response) {
        console.error('[BESAR] Status:', error.response.status)
        console.error('[BESAR] Data:', error.response.data)
      }
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}