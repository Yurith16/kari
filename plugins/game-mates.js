// plugins/mates.js
import { addKryons, addXp, getEconomy, isRegistered, getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const CONFIG_NIVELES = {
  facil: { tiempo: 45000, multi: 1, min: 5, max: 50, ops: ['+', '-'] },
  normal: { tiempo: 50000, multi: 2, min: 10, max: 120, ops: ['+', '-', '*'] },
  dificil: { tiempo: 60000, multi: 3.5, min: 15, max: 200, ops: ['+', '-', '*'] }
}

const frasesAcierto = [
  '¡Mente brillante, {nombre}! Acertaste {respuesta} en modo {nivel}. Ganaste {kryons} y {xp} de exp.',
  '¡Los números te obedecen, {nombre}! {respuesta} era la respuesta. Sumaste {kryons} y {xp} de exp.',
  '¡Calculadora humana, {nombre}! Clavaste {respuesta} en {nivel}. Te llevaste {kryons} y {xp} de exp.',
  '¡Qué cerebro, {nombre}! {respuesta} correcto. Midori te premia con {kryons} y {xp} de exp.',
  '¡Así se calcula, {nombre}! {respuesta} era el número mágico. Ganaste {kryons} y {xp} de exp.',
  '¡Profesor de matemáticas, {nombre}! Diste con {respuesta}. Recompensa: {kryons} y {xp} de exp.',
]

const frasesFallo = [
  '¡Se acabó el tiempo! El resultado era {resultado}. La próxima saldrá mejor.',
  'No era {respuesta}, el número correcto era {resultado}. A seguir practicando.',
  'Casi, {nombre}, pero el resultado era {resultado}. No te rindas.',
  'Las matemáticas no perdonan, era {resultado}. Otra vez será.',
  'Falló el cálculo, el número era {resultado}. Midori te anima a intentar de nuevo.',
  'Esa no era, {nombre}. La respuesta correcta era {resultado}. ¡Sigue entrenando!',
]

function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

function generarOperacion(nivel) {
  const conf = CONFIG_NIVELES[nivel]
  const op = conf.ops[Math.floor(Math.random() * conf.ops.length)]

  let n1 = Math.floor(Math.random() * (conf.max - conf.min + 1)) + conf.min
  let n2 = Math.floor(Math.random() * (conf.max - conf.min + 1)) + conf.min

  if (op === '*') {
    n1 = Math.floor(Math.random() * 15) + 5
    n2 = Math.floor(Math.random() * 12) + 3
  }

  if (op === '-' && n2 > n1) {
    [n1, n2] = [n2, n1]
  }

  let resultado
  switch (op) {
    case '+': resultado = n1 + n2; break
    case '-': resultado = n1 - n2; break
    case '*': resultado = n1 * n2; break
  }

  return {
    pregunta: `${n1} ${op} ${n2}`,
    resultado: resultado
  }
}

export default {
  command: ['mates', 'matematicas', 'calculo'],
  tag: 'juegos',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Resuelve operaciones matemáticas y gana kryons',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const ahora = Date.now()
    if (sesion.ultimoMensaje && (ahora - sesion.ultimoMensaje < 1200)) return
    sesion.ultimoMensaje = ahora

    const entrada = text?.trim()
    if (!entrada) return

    if (entrada.toLowerCase() === 'cancelar') {
      if (sesion.timeoutId) clearTimeout(sesion.timeoutId)
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '> 🌸 Juego cancelado. ¡Nos vemos luego!' }, { quoted: msg })
      return
    }

    if (ahora > sesion.limiteTiempo) return

    if (!/^-?\d+$/.test(entrada)) return

    if (sesion.timeoutId) clearTimeout(sesion.timeoutId)
    const respuestaUsuario = parseInt(entrada)

    if (respuestaUsuario === sesion.resultadoCorrecto) {
      const conf = CONFIG_NIVELES[sesion.nivel]
      const premioKryons = Math.floor((Math.random() * 150 + 100) * conf.multi)
      const premioXp = Math.floor(premioKryons / 4)

      addKryons(userNum, premioKryons)
      addXp(userNum, premioXp)
      sesiones.delete(userNum)

      const frase = frasesAcierto[Math.floor(Math.random() * frasesAcierto.length)]
        .replace('{nombre}', sesion.nombre)
        .replace('{respuesta}', `*${respuestaUsuario}*`)
        .replace('{nivel}', sesion.nivel)
        .replace('{kryons}', `*${premioKryons.toLocaleString()} kryons*`)
        .replace('{xp}', `*${premioXp}*`)

      await sock.sendMessage(from, { react: { text: '🧮', key: msg.key } })
      await sock.sendMessage(from, { text: `> 🌸 ${frase}` }, { quoted: msg })

    } else {
      const correcto = sesion.resultadoCorrecto
      sesiones.delete(userNum)

      const frase = frasesFallo[Math.floor(Math.random() * frasesFallo.length)]
        .replace('{nombre}', sesion.nombre)
        .replace('{respuesta}', `*${respuestaUsuario}*`)
        .replace('{resultado}', `*${correcto}*`)

      await sock.sendMessage(from, { react: { text: '😵', key: msg.key } })
      await sock.sendMessage(from, { text: `> 🌸 ${frase}` }, { quoted: msg })
    }
  },

  async execute(sock, msg, { from, userNum, sender, args }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (sesiones.has(selfNum)) {
      return sock.sendMessage(from, { text: '> 🌸 Ya tienes un desafío matemático en curso. Responde o escribe *cancelar*.' }, { quoted: msg })
    }

    if (!args[0]) {
      return sock.sendMessage(from, {
        text: '> 🧮 Elige la dificultad: *.mates facil* — *.mates normal* — *.mates dificil*'
      }, { quoted: msg })
    }

    const nivelElegido = normalizarTexto(args[0])

    if (!CONFIG_NIVELES[nivelElegido]) {
      return sock.sendMessage(from, { text: '> 🌸 Nivel no válido. Elige entre *facil*, *normal* o *dificil*.' }, { quoted: msg })
    }

    const operacion = generarOperacion(nivelElegido)
    const conf = CONFIG_NIVELES[nivelElegido]
    const ahora = Date.now()

    const perfil = getUser(selfNum)
    const nombre = perfil?.nombre || selfNum

    const timeoutId = setTimeout(async () => {
      const partidaActiva = sesiones.get(selfNum)
      if (partidaActiva) {
        sesiones.delete(selfNum)
        await sock.sendMessage(from, {
          text: `> 🌸 ¡Se acabó el tiempo! El resultado era *${operacion.resultado}*.`
        })
      }
    }, conf.tiempo)

    sesiones.set(selfNum, {
      nivel: nivelElegido,
      nombre: nombre,
      resultadoCorrecto: operacion.resultado,
      limiteTiempo: ahora + conf.tiempo,
      timeoutId: timeoutId,
      ultimoMensaje: 0
    })

    await sock.sendMessage(from, {
      text: `> 🧮 *${operacion.pregunta}*\n> ⏱️ Tienes *${conf.tiempo / 1000}* segundos para responder.`
    }, { quoted: msg })
  }
}