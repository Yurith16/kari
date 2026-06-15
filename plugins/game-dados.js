// plugins/eco-dados.js
import { addKryons, removeXp, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const dadosAnim = [
  'https://tinyurl.com/gdd01',  // 1
  'https://tinyurl.com/gdd02',  // 2
  'https://tinyurl.com/gdd003', // 3
  'https://tinyurl.com/gdd004', // 4
  'https://tinyurl.com/gdd05',  // 5
  'https://tinyurl.com/gdd006', // 6
]

const frasesGano = [
  '¡Midori sacó {dado} y acertaste! Ganaste {ganancia} y {xp} de exp.',
  '¡{dado}! Justo lo que dijiste. Te llevaste {ganancia} y {xp} de exp.',
  'El dado cayó en {dado}, adivinaste. Midori te paga {ganancia} y {xp} de exp.',
  '¡Bingo! {dado} era tu número. Sumaste {ganancia} y {xp} de exp.',
  'Tu intuición no falla, salió {dado}. Ganaste {ganancia} y {xp} de exp.',
  'Midori tiró y salió {dado}, ¡acertaste! {ganancia} y {xp} de exp para vos.',
]

const frasesPierdo = [
  'Salió {dado} y dijiste {numero}. No acertaste, pero Midori te da {consuelo} kryons de cariño.',
  'Midori sacó {dado}, no era tu {numero}. Perdiste, pero toma {consuelo} kryons.',
  'El dado marcó {dado} y tú {numero}. No fue, pero Midori te regala {consuelo} kryons.',
  '{dado} en vez de {numero}. No acertaste, pero aquí tienes {consuelo} kryons de abrazo.',
  'Esperabas {numero} pero salió {dado}. Midori te consuela con {consuelo} kryons.',
  'Fallaste por poco, {dado} no era {numero}. Toma {consuelo} kryons, sin rencores.',
]

export default {
  command: ['dado', 'dados', 'dadu'],
  tag: 'dados',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Adivina qué número sacará Midori en el dado',

  async execute(sock, msg, { from, sender, args, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const numeroElegido = parseInt(args[0])

    if (isNaN(numeroElegido) || numeroElegido < 1 || numeroElegido > 6) {
      return sock.sendMessage(from, {
        text: '> 🎲 Elige un número del *1* al *6*. Ejemplo: *.dado 4*'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, { react: { text: '🎲', key: msg.key } })

    const dadoMidori = Math.floor(Math.random() * 6) + 1

    await new Promise(r => setTimeout(r, 500))

    // Enviar sticker del dado de Midori
    await sock.sendMessage(from, {
      sticker: { url: dadosAnim[dadoMidori - 1] }
    }, { quoted: msg })

    await new Promise(r => setTimeout(r, 800))

    if (numeroElegido === dadoMidori) {
      const ganancia = Math.floor(Math.random() * 2500) + 1500
      const xp = Math.floor(Math.random() * 80) + 40

      addKryons(selfNum, ganancia)
      addXp(selfNum, xp)

      const frase = frasesGano[Math.floor(Math.random() * frasesGano.length)]
        .replace('{dado}', `🎲${dadoMidori}`)
        .replace('{ganancia}', `*${ganancia.toLocaleString()} kryons*`)
        .replace('{xp}', `*${xp}*`)

      await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
      await sock.sendMessage(from, { text: `> 🌸 ${frase}` }, { quoted: msg })

    } else {
      const consuelo = Math.floor(Math.random() * 200) + 100
      const xpPierde = Math.floor(Math.random() * 10) + 5

      addKryons(selfNum, consuelo)
      removeXp(selfNum, xpPierde)

      const frase = frasesPierdo[Math.floor(Math.random() * frasesPierdo.length)]
        .replace('{dado}', `🎲${dadoMidori}`)
        .replace('{numero}', `*${numeroElegido}*`)
        .replace('{consuelo}', `*${consuelo}*`)

      await sock.sendMessage(from, { react: { text: '😵', key: msg.key } })
      await sock.sendMessage(from, { text: `> 🌸 ${frase}` }, { quoted: msg })
    }
  }
}