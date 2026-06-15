// plugins/eco-ruleta.js
import { addKryons, removeKryons, addXp, removeXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const colores = ['🔴', '🟡', '🟢']
const multiplicadores = [2, 3, 4, 5, 6]

const frasesGano = [
  '¡Giró la ruleta y salió {color}! Acertaste, ganaste {ganancia} y {xp} de exp.',
  '¡{color}! Justo lo que apostaste. Te llevaste {ganancia} y {xp} de exp.',
  'La ruleta se detuvo en {color}. ¡Ganaste {ganancia} y {xp} de exp!',
  '¡Bingo! {color} era tu color. Midori te paga {ganancia} y {xp} de exp.',
  '¡Giro ganador! {color} te dio {ganancia} y {xp} de exp.',
  'La bolita cayó en {color}. Acertaste, sumaste {ganancia} y {xp} de exp.',
]

const frasesPierdo = [
  'Salió {color} y no era tu color. Perdiste {apuesta}, pero Midori te regala {consuelo} kryons para que no te vayas triste.',
  'Giró y salió {color}. No acertaste, perdiste {apuesta}. Midori te da {consuelo} kryons de abrazo, no todo está perdido.',
  'La ruleta marcó {color}. Perdiste {apuesta}, pero Midori te susurra: toma {consuelo} kryons, la próxima será.',
  '{color} fue el ganador, perdiste {apuesta}. Midori te pone {consuelo} kryons en la mano, con cariño.',
  'No estuvo de tu lado, salió {color}. Perdiste {apuesta}, pero Midori te consuela con {consuelo} kryons.',
  'Midori giró y salió {color}. Perdiste {apuesta}, pero ella te deja {consuelo} kryons en el bolsillo, sin que nadie lo vea.',
]

export default {
  command: ['ruleta', 'roulette'],
  tag: 'ruleta',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Apuesta a un color en la ruleta',

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
      let lista = '> 🎡 Elige un color y apuesta:\n> \n'
      lista += '> 🔴 · *rojo*\n'
      lista += '> 🟡 · *amarillo*\n'
      lista += '> 🟢 · *verde*\n'
      lista += '> \n> Mínimo: *50* — Máximo: *10,000*\n'
      lista += '> Ejemplo: *.ruleta rojo 500*'
      return sock.sendMessage(from, { text: lista }, { quoted: msg })
    }

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: '> 🎡 Indica el color y la apuesta. Ejemplo: *.ruleta rojo 500*'
      }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)
    const apuesta = parseInt(args[args.length - 1])

    if (isNaN(apuesta) || apuesta < 50) {
      return sock.sendMessage(from, { text: '> 🎡 La apuesta mínima es de *50 kryons*.' }, { quoted: msg })
    }

    if (apuesta > 10000) {
      return sock.sendMessage(from, { text: '> 🎡 La apuesta máxima es de *10,000 kryons*.' }, { quoted: msg })
    }

    if (eco.kryons < apuesta) {
      return sock.sendMessage(from, {
        text: `> 🎡 No te alcanza. Tienes *${eco.kryons.toLocaleString()} kryons* en mano.`
      }, { quoted: msg })
    }

    const eleccion = args.slice(0, -1).join(' ').toLowerCase().trim()

    let colorElegido = null
    if (eleccion === 'rojo') colorElegido = '🔴'
    else if (eleccion === 'amarillo') colorElegido = '🟡'
    else if (eleccion === 'verde') colorElegido = '🟢'
    else {
      return sock.sendMessage(from, {
        text: '> 🎡 Ese color no está. Elige *rojo*, *amarillo* o *verde*.'
      }, { quoted: msg })
    }

    const colorGanador = colores[Math.floor(Math.random() * colores.length)]
    const multi = multiplicadores[Math.floor(Math.random() * multiplicadores.length)]

    removeKryons(selfNum, apuesta)

    // Enviar mensaje inicial del giro
    const msgGiro = await sock.sendMessage(from, {
      text: `> 🎡 Girando... ${colores[Math.floor(Math.random() * 3)]}`
    }, { quoted: msg })

    // Simular giro editando el mensaje
    const pasos = 5
    for (let i = 0; i < pasos; i++) {
      await new Promise(r => setTimeout(r, 600))
      const colorRandom = colores[Math.floor(Math.random() * 3)]
      await sock.sendMessage(from, {
        edit: msgGiro.key,
        text: `> 🎡 Girando... ${colorRandom}`
      })
    }

    // Resultado final
    await new Promise(r => setTimeout(r, 400))

    if (colorElegido === colorGanador) {
      const ganancia = apuesta * multi
      const xp = Math.floor(ganancia / 5)

      addKryons(selfNum, ganancia)
      addXp(selfNum, xp)

      const frase = frasesGano[Math.floor(Math.random() * frasesGano.length)]
        .replace('{color}', `${colorGanador} x${multi}`)
        .replace('{ganancia}', `*${ganancia.toLocaleString()} kryons*`)
        .replace('{xp}', `*${xp}*`)

      await sock.sendMessage(from, {
        edit: msgGiro.key,
        text: `> 🌸 ${frase}`
      })

    } else {
      const consuelo = Math.floor(apuesta * 0.1)
      const xpPierde = Math.floor(Math.random() * 5) + 1

      addKryons(selfNum, consuelo)
      removeXp(selfNum, xpPierde)

      const frase = frasesPierdo[Math.floor(Math.random() * frasesPierdo.length)]
        .replace('{color}', colorGanador)
        .replace('{apuesta}', `*${apuesta.toLocaleString()} kryons*`)
        .replace('{consuelo}', `*${consuelo}*`)

      await sock.sendMessage(from, {
        edit: msgGiro.key,
        text: `> 🌸 ${frase}`
      })
    }
  }
}