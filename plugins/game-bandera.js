// plugins/bandera.js
import fs from 'fs'
import path from 'path'
import { addKryons, addXp, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const banderasPath = path.join(process.cwd(), 'core', 'banderas.json')
const banderasData = JSON.parse(fs.readFileSync(banderasPath, 'utf-8'))
const paises = banderasData.paises

const frasesInicio = [
  '¿Cuál es la bandera de {pais}?',
  'Encuentra la bandera de {pais}.',
  'Señala la bandera de {pais}.',
  'A ver, ¿dónde está la bandera de {pais}?',
  'Busca la bandera de {pais} entre estas.',
]

const frasesVictoria = [
  '¡Correcto! Era la bandera de {pais}. Ganaste {kryons} y {xp} de exp.',
  '¡Muy bien! {pais} era la respuesta. Te llevaste {kryons} y {xp} de exp.',
  '¡Adivinaste! {pais} es la bandera. Midori te da {kryons} y {xp} de exp.',
  '¡Buen ojo! La bandera de {pais} era. Ganaste {kryons} y {xp} de exp.',
]

const frasesDerrota = [
  'Fallaste. La bandera de {pais} era la opción {num}.',
  'No era, la respuesta era {num}: {pais}.',
  'Se acabaron los intentos, era la bandera de {pais}.',
  'Perdiste, era la bandera de {pais}.',
]

function obtenerOpciones(paisCorrecto) {
  const otros = paises.filter(p => p.nombre !== paisCorrecto.nombre)
  const opciones = [paisCorrecto, ...otros.sort(() => Math.random() - 0.5).slice(0, 9)]
  return opciones.sort(() => Math.random() - 0.5)
}

export default {
  command: ['bandera', 'flag', 'adivinabandera', 'guessflag'],
  tag: 'bandera',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Encuentra la bandera del país indicado',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (respuesta.toLowerCase() === 'cancelar') {
      clearTimeout(sesion.timer)
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '> 🌸 Juego cancelado.' }, { quoted: msg })
      return
    }

    const numeroElegido = parseInt(respuesta)
    if (isNaN(numeroElegido) || numeroElegido < 1 || numeroElegido > 10) return

    const idx = numeroElegido - 1
    const opcionSeleccionada = sesion.opciones[idx]
    const paisCorrecto = sesion.paisCorrecto

    if (opcionSeleccionada.nombre === paisCorrecto.nombre) {
      clearTimeout(sesion.timer)
      const ganancia = Math.floor(Math.random() * 800) + 400
      const xp = Math.floor(ganancia / 4)

      addKryons(userNum, ganancia)
      addXp(userNum, xp)
      sesiones.delete(userNum)

      const msgV = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)]
        .replace('{pais}', paisCorrecto.nombre)
        .replace('{kryons}', `*${ganancia.toLocaleString()} kryons*`)
        .replace('{xp}', `*${xp}*`)

      await sock.sendMessage(from, { react: { text: '🌍', key: msg.key } })
      await sock.sendMessage(from, { text: `> 🌸 ${msgV}` }, { quoted: msg })
      return
    }

    sesion.intentos++
    if (sesion.intentos >= 2) {
      clearTimeout(sesion.timer)
      const opcionCorrecta = sesion.opciones.findIndex(p => p.nombre === paisCorrecto.nombre) + 1
      sesiones.delete(userNum)

      const msgD = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)]
        .replace('{pais}', paisCorrecto.nombre)
        .replace('{num}', opcionCorrecta)

      await sock.sendMessage(from, { react: { text: '💔', key: msg.key } })
      await sock.sendMessage(from, { text: `> 🌸 ${msgD}` }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, {
      text: `> 🌸 No es, te queda 1 intento.`
    }, { quoted: msg })
  },

  async execute(sock, msg, { from, userNum, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (sesiones.has(selfNum)) {
      return sock.sendMessage(from, { text: '> 🌸 Ya tienes un juego activo. Responde o escribe *cancelar*.' }, { quoted: msg })
    }

    const paisObjetivo = paises[Math.floor(Math.random() * paises.length)]
    const opciones = obtenerOpciones(paisObjetivo)
    const opcionCorrecta = opciones.findIndex(p => p.nombre === paisObjetivo.nombre) + 1

    const timer = setTimeout(async () => {
      if (sesiones.has(selfNum)) {
        sesiones.delete(selfNum)
        await sock.sendMessage(from, {
          text: `> 🌸 ¡Se acabó el tiempo! La bandera de *${paisObjetivo.nombre}* era la número ${opcionCorrecta}.`
        })
      }
    }, 30000)

    sesiones.set(selfNum, {
      intentos: 1,
      paisCorrecto: paisObjetivo,
      opciones,
      opcionCorrecta,
      timer
    })

    const frase = frasesInicio[Math.floor(Math.random() * frasesInicio.length)]
      .replace('{pais}', `*${paisObjetivo.nombre}*`)

    let txt = `> 🌸 ${frase}\n> ⏳ 30 segundos  │  ❤️ x2\n> \n`

    for (let i = 0; i < 5; i++) {
      txt += `> ✦ ${i + 1}. ${opciones[i].bandera}  │  ✦ ${i + 6}. ${opciones[i + 5].bandera}\n`
    }

    await sock.sendMessage(from, { react: { text: '🌍', key: msg.key } })
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}