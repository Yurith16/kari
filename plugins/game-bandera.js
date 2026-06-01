// plugins/bandera.js
import fs from 'fs'
import path from 'path'
import { addKryons, addXp } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const banderasPath = path.join(process.cwd(), 'data', 'banderas.json')
const banderasData = JSON.parse(fs.readFileSync(banderasPath, 'utf-8'))
const paises = banderasData.paises

function obtenerOpciones(paisCorrecto) {
  const otros = paises.filter(p => p.nombre !== paisCorrecto.nombre)
  const otrosBarajados = otros.sort(() => Math.random() - 0.5)
  const opciones = [paisCorrecto, ...otrosBarajados.slice(0, 9)]
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
  descripcion: '🌸 Encuentra la bandera del país que te pida y gana kryons',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    // Solo procesar si es "cancelar" o si es un número válido (1-10)
    const esCancelar = respuesta.toLowerCase() === 'cancelar'
    const numeroElegido = parseInt(respuesta)
    const esNumeroValido = !isNaN(numeroElegido) && numeroElegido >= 1 && numeroElegido <= 10

    // Si no es ninguna de las dos, ignoramos el mensaje para no interferir en el chat
    if (!esCancelar && !esNumeroValido) return

    if (esCancelar) {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌿 Juego cancelado.' }, { quoted: msg })
      return
    }

    if (sesion.paso === 'jugando') {
      const idx = numeroElegido - 1
      const opcionSeleccionada = sesion.opciones[idx]
      const paisCorrecto = sesion.paisCorrecto

      if (opcionSeleccionada.nombre === paisCorrecto.nombre) {
        const ganancia = obtenerGanancia()
        const xpGanada = Math.floor(ganancia / 5)
        
        addKryons(userNum, ganancia)
        addXp(userNum, xpGanada)
        
        sesiones.delete(userNum)
        await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
        await sock.sendMessage(from, {
          text: `> 🌸 *¡CORRECTO!* 🌸\n> ✦ Ganaste *${ganancia} kryons* + *${xpGanada} XP* ✨`
        }, { quoted: msg })
        return
      }

      sesion.intentos++
      if (sesion.intentos >= 2) {
        sesiones.delete(userNum)
        await sock.sendMessage(from, { react: { text: '💔', key: msg.key } })
        await sock.sendMessage(from, {
          text: `> 🌸 *GAME OVER* 🌸\n> ✦ La bandera de *${paisCorrecto.nombre}* era la opción ${sesion.opcionCorrecta}\n> ✦ Vuelve a intentarlo con .bandera 🌿`
        }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, {
        text: `> 🌸 *INCORRECTO* 🌸\n> ✦ Te queda 1 intento.\n> ✦ Responde con el número de la opción correcta:`
      }, { quoted: msg })
    }
  },

  async execute(sock, msg, { from, userNum, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (sesiones.has(selfNum)) {
      await sock.sendMessage(from, { text: '🌸 Ya tienes un juego activo. Termínalo o escribe *cancelar*.' }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🌍', key: msg.key } })

    const paisObjetivo = paises[Math.floor(Math.random() * paises.length)]
    const opciones = obtenerOpciones(paisObjetivo)
    const opcionCorrecta = opciones.findIndex(p => p.nombre === paisObjetivo.nombre) + 1

    const primeraFila = opciones.slice(0, 5)
    const segundaFila = opciones.slice(5, 10)

    let txt = `> 🌸 *ENCUENTRA LA BANDERA DE:* ${paisObjetivo.nombre} 🌸\n\n`

    for (let i = 0; i < 5; i++) {
        const izq = primeraFila[i]
        const der = segundaFila[i]
        txt += `> ✦ ${String(i + 1).padStart(2, ' ')}. ${izq.bandera}  │  ✦ ${i + 6}. ${der.bandera}\n`
    }

    txt += `\n> 🌿 Responde con el *número* de la opción.\n> 🚫 Escribe *cancelar* para salir.`

    sesiones.set(selfNum, {
      paso: 'jugando',
      intentos: 1,
      paisCorrecto: paisObjetivo,
      opciones: opciones,
      opcionCorrecta: opcionCorrecta
    })

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}