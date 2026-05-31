// plugins/golpear.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['golpear', 'golpe', 'patada', 'pegar', 'madraso'],
  tag:       'golpear',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de golpe a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👊', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/kick`
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
        txt = `👊 ¡Fight! @${selfTag} le metió un golpe a @${victimTag}... ¡eso tuvo que doler! 💥`
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        txt = `👊 ¡Doble golpe! @${selfTag} le pegó a @${victim1Tag} y @${victim2Tag}... ¡alto ahí! 💥`
      }
      else {
        const frasesRandom = [
          `🤡 @${selfTag} se dio un golpe solito, ¿y a este qué le dio?`,
          `💨 @${selfTag} anda tirando golpes al aire porque sí.`,
          `🤕 @${selfTag} se metió un golpe para ver si despertaba.`,
          `🥊 @${selfTag} quería pelear pero no encontró contrincante.`
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
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}