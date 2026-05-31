// plugins/reaccion_solo.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['manosear', 'tocarse'],
  tag:       'tocarse',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Reacción NSFW de chica tocándose sola',

  async execute(sock, msg, { from, groupCfg }) {
    // Verificación de configuración del grupo para contenido NSFW
    if (!groupCfg?.nsfw) {
      await sock.sendMessage(from, { text: '⚠️ Este grupo no tiene activado el contenido NSFW.' }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔥', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/solo`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]
      
      const frases = [
        `🔞 @${selfTag} decidió tomarse un momento a solas para disfrutar de su propio placer. ¡Qué intensidad!`,
        `😈 @${selfTag} no necesita a nadie más para subir la temperatura, ¡está en su propio mundo!`,
        `💦 @${selfTag} se está complaciendo a sí misma y no tiene ninguna vergüenza. ¡Puro fuego!`,
        `🔥 @${selfTag} demuestra que ella sola es más que suficiente para calentar todo el chat.`
      ]
      
      const txt = frases[Math.floor(Math.random() * frases.length)]

      await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: [selfJid]
      }, { quoted: msg })

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}