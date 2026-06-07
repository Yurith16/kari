// plugins/mimo.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['mimo', 'esponjoso', 'ternura', 'mimos', 'cariño'],
  tag:       'mimo',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de mimos a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '☁️', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/fluff`
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
          `☁️ @${selfTag} dejó de lado su orgullo por un segundo para llenarle el chat de mimos a @${victimTag}... Un intento desesperado por curar los celos y la distancia. 💖`,
          `🔥 Entre tantos silencios y verdades reprimidas, @${selfTag} se puso dulce con @${victimTag}. Un abrazo digital cargado de un drama pasional indomable.`,
          `✨ @${selfTag} buscó refugio en los brazos de @${victimTag} con timidez. Dejando expuesto ante todo el grupo lo mucho que le quema su fría indiferencia.`,
          `🎭 Rompiendo el hielo de la peor forma, @${selfTag} le da cariño a @${victimTag}. Un destello de ternura pura que busca revivir la complicidad perdida.`,
          `📜 @${selfTag} no pudo fingir más desinterés y se rindió ante @${victimTag}, cobrando una vieja deuda de amor con caricias que nadie más comprende.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🌸 @${selfTag} anda en modo esponjoso en solitario... Buscando desesperadamente llamar la atención de un corazón distante que prefiere ignorarle.`,
          `☁️ @${selfTag} se mima a sí mismo en el chat para ocultar el vacío de su pantalla. Un drama silencioso de ego herido al notar la soledad del grupo.`,
          `🧸 @${selfTag} está repartiendo vibras bonitas al aire. Una coraza cínica para no aceptar que se muere por unos cariños que hoy no va a recibir.`,
          `🍬 @${selfTag} entró en modo dulce consigo mismo. Sus defensas cayeron por completo al darse cuenta de que su orgullo no basta para sanar la nostalgia.`,
          `🩹 @${selfTag} abraza la nada frente al chat vacío. Un alma lastimada que simula ternura para no estallar en reclamos ante esa persona especial.`
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
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}