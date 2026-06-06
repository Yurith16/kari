// plugins/bandera.js
import fs from 'fs'
import path from 'path'
import { addKryons, addXp } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const banderasPath = path.join(process.cwd(), 'data', 'banderas.json')
const banderasData = JSON.parse(fs.readFileSync(banderasPath, 'utf-8'))
const paises = banderasData.paises

const frasesInicio = [
  "¿A que no sabes cuál es la bandera de {pais}?",
  "¡Demuéstrame que eres un genio en geografía! ¿Dónde está la bandera de {pais}?",
  "Me he propuesto retarte: ¿puedes encontrar la bandera de {pais}?",
  "Estaba aburrida y quiero ver si eres capaz de identificar la bandera de {pais}.",
  "¡Hora de jugar! Vamos a ver si atinas con la bandera de {pais}."
]

const frasesVictoria = [
  "¡Vaya! Me impresionas, esa era la de {pais}. ¡Toma tus {ganancia} kryons!",
  "¡Correcto! Veo que no pierdes el tiempo, {pais} era la respuesta. Aquí tienes tu recompensa.",
  "¡Lo lograste! Eres todo un experto en banderas. ¡Toma tus {ganancia} kryons!",
  "¡Muy bien jugado! No me lo pusiste nada fácil, pero la bandera de {pais} era la que buscábamos."
]

const frasesDerrota = [
  "¡Oh, no! La bandera de {pais} era la opción {num}. ¡Para la próxima será!",
  "Ups... esa no era. La bandera de {pais} estaba escondida en la opción {num}. ¡Inténtalo de nuevo!",
  "¡Casi, pero no! Era la opción {num}, la de {pais}. ¡No te rindas ahora!",
  "¡Rayos! Me quedo con tus kryons esta vez. La bandera de {pais} era la {num}."
]

function obtenerOpciones(paisCorrecto) {
  const otros = paises.filter(p => p.nombre !== paisCorrecto.nombre)
  const opciones = [paisCorrecto, ...otros.sort(() => Math.random() - 0.5).slice(0, 9)]
  return opciones.sort(() => Math.random() - 0.5)
}

function obtenerGanancia() {
  const ganancias = [50, 75, 100, 125, 150, 175, 200]
  return ganancias[Math.floor(Math.random() * ganancias.length)]
}

export default {
  command: ['bandera', 'flag', 'adivinabandera', 'guessflag'],
  tag: 'bandera',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: '🌸 Encuentra la bandera del país y gana kryons',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    const esCancelar = respuesta.toLowerCase() === 'cancelar'
    const numeroElegido = parseInt(respuesta)
    const esNumeroValido = !isNaN(numeroElegido) && numeroElegido >= 1 && numeroElegido <= 10

    if (!esCancelar && !esNumeroValido) return

    if (esCancelar) {
      clearTimeout(sesion.timer)
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌿 Juego cancelado. ¡Cuando quieras volvemos a jugar!' }, { quoted: msg })
      return
    }

    if (sesion.paso === 'jugando') {
      const idx = numeroElegido - 1
      const opcionSeleccionada = sesion.opciones[idx]
      const paisCorrecto = sesion.paisCorrecto

      if (opcionSeleccionada.nombre === paisCorrecto.nombre) {
        clearTimeout(sesion.timer)
        const ganancia = obtenerGanancia()
        const xpGanada = Math.floor(ganancia / 5)
        addKryons(userNum, ganancia)
        addXp(userNum, xpGanada)
        sesiones.delete(userNum)
        
        const msgV = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)].replace('{pais}', paisCorrecto.nombre).replace('{ganancia}', ganancia)
        await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
        await sock.sendMessage(from, { text: `> 🌸 ${msgV} + *${xpGanada} XP* ✨` }, { quoted: msg })
        return
      }

      sesion.intentos++
      if (sesion.intentos >= 2) {
        clearTimeout(sesion.timer)
        sesiones.delete(userNum)
        const msgD = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)].replace('{pais}', paisCorrecto.nombre).replace('{num}', sesion.opcionCorrecta)
        await sock.sendMessage(from, { react: { text: '💔', key: msg.key } })
        await sock.sendMessage(from, { text: `> 🌸 ${msgD}` }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { text: `> 🌸 ¡Esa no es! Te queda solo una oportunidad. ¡Concéntrate, que el tiempo vuela!` }, { quoted: msg })
    }
  },

  async execute(sock, msg, { from, userNum, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (sesiones.has(selfNum)) return sock.sendMessage(from, { text: '🌸 Ya tienes un juego activo. Termínalo o escribe *cancelar*.' }, { quoted: msg })

    const paisObjetivo = paises[Math.floor(Math.random() * paises.length)]
    const opciones = obtenerOpciones(paisObjetivo)
    const opcionCorrecta = opciones.findIndex(p => p.nombre === paisObjetivo.nombre) + 1

    const timer = setTimeout(async () => {
        if (sesiones.has(selfNum)) {
            sesiones.delete(selfNum)
            await sock.sendMessage(from, { text: `> 🌸 ¡Se acabó el tiempo! La bandera de *${paisObjetivo.nombre}* era la número ${opcionCorrecta}. 🌿` }, { quoted: msg })
        }
    }, 30000) // 30 segundos para responder

    sesiones.set(selfNum, { paso: 'jugando', intentos: 1, paisCorrecto: paisObjetivo, opciones, opcionCorrecta, timer })

    const frase = frasesInicio[Math.floor(Math.random() * frasesInicio.length)].replace('{pais}', paisObjetivo.nombre)
    let txt = `> 🌸 *${frase}*\n> ⏳ *Tienes 30 segundos.* 🌸\n\n`
    for (let i = 0; i < 5; i++) {
        txt += `> ✦ ${String(i + 1).padStart(2, ' ')}. ${opciones[i].bandera}  │  ✦ ${i + 6}. ${opciones[i + 5].bandera}\n`
    }
    txt += `\n> 🌿 Responde con el *número* o *cancelar*.`

    await sock.sendMessage(from, { react: { text: '🌍', key: msg.key } })
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}