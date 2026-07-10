// plugins/eco-trabajar.js
import { addKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { TRABAJAR } from '../settings/economia.js'

const RESPUESTAS = [
  'Terminaste el turno y la verdad no fue tan malo. Ganaste *{amt}* kryons.',
  'No era el trabajo más emocionante del mundo, pero *{amt}* kryons en el bolsillo no se discuten.',
  'Hiciste lo que había que hacer. *{amt}* kryons ganados, sin más dramas.',
  'Otro día, otro peso. Bueno, *{amt}* kryons en este caso, pero la idea es la misma.',
  'Cumpliste y eso cuenta. *{amt}* kryons para lo que necesites.',
  'No te quejes, podría haber sido peor. *{amt}* kryons y a seguir.',
  'El trabajo no se hizo solo, y tú lo sabes. *{amt}* kryons como prueba de eso.',
  'Terminaste antes de lo esperado. *{amt}* kryons, nada mal para el tiempo que tardaste.',
  'Nadie dijo que sería fácil, pero tampoco fue tan difícil. *{amt}* kryons.',
  'Saliste adelante una vez más. *{amt}* kryons bien ganados.',
  'Hay días mejores y días peores, pero hoy terminaste con *{amt}* kryons así que no está mal.',
  'El esfuerzo tuvo su recompensa esta vez. *{amt}* kryons para demostrarlo.',
  'No todos trabajan, pero tú sí. Aquí están tus *{amt}* kryons.',
  'Se hizo lo que se tenía que hacer. *{amt}* kryons y a descansar un rato.',
  'No fue glamoroso, pero fue efectivo. *{amt}* kryons en tu cartera.',
  'Otro turno completado. *{amt}* kryons, que no es poco si lo piensas bien.',
  'Hiciste tu parte y el resultado ahí está — *{amt}* kryons.',
  'Podrías haberte quedado sin hacer nada, pero no lo hiciste. *{amt}* kryons por esa decisión.',
  'El trabajo de hoy ya quedó atrás. *{amt}* kryons y a pensar en el siguiente.',
  'No se puede vivir sin trabajar, dicen. Hoy lo comprobaste con *{amt}* kryons.',
  'Cumpliste el turno completo sin quejarte mucho. *{amt}* kryons como resultado.',
  'Había que hacerlo y lo hiciste. *{amt}* kryons, sin más.',
  'No siempre el trabajo es interesante, pero siempre paga. Hoy: *{amt}* kryons.',
  'Terminaste y eso es lo que importa. *{amt}* kryons para el bolsillo.',
  'Un turno más en el libro. *{amt}* kryons ganados con lo que hay.',
]

const COOLDOWN_MSGS = [
  'Acabas de terminar un turno, date un momento antes del siguiente. Vuelve en *{tiempo}*.',
  'Todavía estás en descanso obligatorio. Quedan *{tiempo}* para el próximo turno.',
  'No puedes trabajar sin parar, eso no es sano. Vuelve en *{tiempo}*.',
  'El siguiente turno empieza en *{tiempo}*, por ahora descansa.',
  'Faltan *{tiempo}* para que puedas volver a trabajar. Aprovecha el descanso.',
]

let indiceRespuesta = 0

function tiempoRestante(secsLeft) {
  if (secsLeft >= 60) {
    const mins = Math.ceil(secsLeft / 60)
    return `${mins} minuto${mins > 1 ? 's' : ''}`
  }
  return `${secsLeft} segundo${secsLeft > 1 ? 's' : ''}`
}

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default {
  command:     ['trabajar', 'work', 'trabajo'],
  tag:         'trabajar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Trabaja para ganar kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_trabajo')
    const secsLeft = TRABAJAR.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    const amt = Math.floor(Math.random() * (TRABAJAR.max - TRABAJAR.min + 1)) + TRABAJAR.min

    addKryons(selfNum, amt)
    addXp(selfNum, TRABAJAR.xp)
    setUltimo(selfNum, 'ultimo_trabajo', ahora)

    // Frase rotativa global — avanza con cada uso sin importar quién lo use
    const texto = RESPUESTAS[indiceRespuesta % RESPUESTAS.length].replace('{amt}', amt.toLocaleString())
    indiceRespuesta++

    await sock.sendMessage(from, { react: { text: '💼', key: msg.key } })
    await sock.sendMessage(from, { text: texto }, { quoted: msg })
  }
}