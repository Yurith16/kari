// plugins/eco-slot.js
import { addKryons, removeKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

const slots = ['🍒', '💎', '🍋', '🎰', '🍀', '🍇', '🌸', '🌟', '🔔']

const frasesVictoria = [
  '¡Lo lograste, ganaste {kryons} sin parar y además sumaste 25 de exp!',
  '¡Victoria! Ganaste {kryons} de una sola tirada, los astros se alinearon y sumaste 25 de exp.',
  'La suerte te abrazó fuerte, ganaste {kryons} con 25 de exp de regalo.',
  'El casino de Midori tiembla, ganaste {kryons} y 25 de exp en un solo giro.',
  '¡Boom! La máquina se iluminó y ganaste {kryons} junto con 25 de exp.',
  'Las estrellas bailaron a tu favor, ganaste {kryons} y 25 de exp.',
  'Midori aplaude desde la bóveda, ganaste {kryons} y 25 de exp de pura suerte.',
  'Los engranajes cantaron tu nombre, ganaste {kryons} más 25 de exp.',
  'Esta vez le ganaste a la casa, {kryons} y 25 de exp para vos.',
  'La máquina se rindió, ganaste {kryons} y 25 de exp directo a tu jardín.',
  'El jardín entero celebra, ganaste {kryons} y 25 de exp en una ronda legendaria.',
  'Ganaste una fortuna, {kryons} y 25 de exp en un solo giro, así se juega.',
]

const frasesDerrota = [
  'La máquina se tragó tus {kryons} sin pestañear. ¡Perdiste!',
  'No era tu momento, el slot se quedó con tus {kryons}. ¡Perdiste!',
  'La casa siempre gana, perdiste {kryons}, pero no te rindas.',
  'Giraste con fe pero esta vez perdiste {kryons}.',
  'La suerte estaba fría, perdiste {kryons}, mejor suerte la próxima.',
  'Midori guardó tus {kryons} en el jardín, perdiste esta ronda.',
  'La máquina no quiso soltar nada, perdiste {kryons}, así es el casino.',
  'Se fueron {kryons} entre los engranajes. ¡Perdiste!',
  'Respirá hondo, esta vez perdiste {kryons}, la próxima es tuya.',
  'Perdiste {kryons}, pero la leyenda sigue escribiéndose.',
  'El slot no estaba de humor, perdiste {kryons} de un bocado.',
  'Volaron {kryons} y no volvieron. ¡Perdiste!',
]

const frasesDoble = [
  '¡Dos iguales! Recuperaste {kryons} y ganaste 10 de exp, zafaste.',
  'Casi la pegas, pero recuperaste {kryons} y 10 de exp, no perdiste nada.',
  'No está mal, la máquina te devolvió {kryons} y sumaste 10 de exp.',
  'Dos de tres, el slot te tiró {kryons} y 10 de exp de consuelo.',
  'La suerte no fue plena pero recuperaste {kryons} y 10 de exp.',
  'Te salvaste por un emoji, {kryons} de vuelta y 10 de exp, safaste.',
  'El slot te sonrió a medias, recuperaste {kryons} y 10 de exp.',
  'No perdiste todo, {kryons} y 10 de exp te mantienen en juego.',
  'Zafaste del cero, {kryons} y 10 de exp, algo es algo.',
  'Casi casi... pero {kryons} y 10 de exp no te dejaron en cero.',
  'Dos emojis iguales y el susto pasó, {kryons} y 10 de exp a salvo.',
  'La máquina te perdonó con {kryons} y 10 de exp, seguís en pie.',
]

export default {
  command: ['tragamonedas', 'slots', 'slot', 'apostar'],
  tag: 'slot',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Apuesta tus kryons en la máquina tragamonedas',

  async execute(sock, msg, { from, sender, args, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (!args[0]) {
      return sock.sendMessage(from, { text: '🌸 Especifica cuánto vas a apostar. Ejemplo: .slot 100' }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)
    let apuesta = 0

    if (args[0].toLowerCase() === 'all') {
      apuesta = eco.kryons || 0
    } else {
      apuesta = parseInt(args[0])
    }

    if (isNaN(apuesta) || apuesta <= 0) {
      return sock.sendMessage(from, { text: '🌸 Ingresa una cantidad válida de kryons.' }, { quoted: msg })
    }

    if (apuesta < 10) {
      return sock.sendMessage(from, { text: '🌸 La apuesta mínima es de 10 kryons.' }, { quoted: msg })
    }

    if (eco.kryons < apuesta) {
      return sock.sendMessage(from, { text: `🌸 No te alcanza en mano. Tienes *${eco.kryons.toLocaleString()} kryons* en la cartera.` }, { quoted: msg })
    }

    removeKryons(selfNum, apuesta)

    await sock.sendMessage(from, { react: { text: '🎰', key: msg.key } })

    // --- LÓGICA DE GIRO ---
    let a = Math.floor(Math.random() * slots.length)
    let b = Math.floor(Math.random() * slots.length)
    let c = Math.floor(Math.random() * slots.length)

    const x = [], y = [], z = []

    for (let i = 0; i < 3; i++) {
      x[i] = slots[a]
      a++
      if (a == slots.length) a = 0
    }
    for (let i = 0; i < 3; i++) {
      y[i] = slots[b]
      b++
      if (b == slots.length) b = 0
    }
    for (let i = 0; i < 3; i++) {
      z[i] = slots[c]
      c++
      if (c == slots.length) c = 0
    }

    const tituloApuestas = toBold('SLOTS')

    let txt = `> 🎰 *${tituloApuestas}* 🎰\n`
    txt += `> ────────\n`
    txt += `> ${x[0]} : ${y[0]} : ${z[0]}\n`
    txt += `> ${x[1]} : ${y[1]} : ${z[1]}\n`
    txt += `> ${x[2]} : ${y[2]} : ${z[2]}\n`
    txt += `> ────────\n`

    if (x[1] === y[1] && y[1] === z[1]) {
      const ganancia = apuesta * 3
      addKryons(selfNum, ganancia)
      addXp(selfNum, 25)

      const frase = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)]
      txt += `> 🎰 | 🌸 ${frase.replace('{kryons}', `*${ganancia.toLocaleString()} kryons*`)}`

    } else if (x[1] === y[1] || x[1] === z[1] || y[1] === z[1]) {
      const ganancia = Math.floor(apuesta * 1.5)
      addKryons(selfNum, ganancia)
      addXp(selfNum, 10)

      const frase = frasesDoble[Math.floor(Math.random() * frasesDoble.length)]
      txt += `> 🎰 | 🌸 ${frase.replace('{kryons}', `*${ganancia.toLocaleString()} kryons*`)}`

    } else {
      const frase = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)]
      txt += `> 🎰 | 🌸 ${frase.replace('{kryons}', `*${apuesta.toLocaleString()} kryons*`)}`
    }

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}