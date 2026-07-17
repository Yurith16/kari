// plugins/eco-semanal.js
import { addKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { SEMANAL } from '../settings/economia.js'

const RESPUESTAS = [
  'Una semana más sin desaparecer del jardín y Midori lo notó. Toma *{amt}* kryons, te los ganaste con constancia.',
  'Siete días seguidos por aquí tienen su recompensa. *{amt}* kryons por no haberte ido.',
  'No cualquiera se queda una semana entera, pero vos sí. *{amt}* kryons como debe ser.',
  'La recompensa semanal llegó y no está nada mal. *{amt}* kryons para vos.',
  'El jardín no olvida a los que se quedan. *{amt}* kryons por otra semana cumplida.',
  'Pasaron siete días y seguís acá. Eso vale *{amt}* kryons, según Midori.',
  'Una semana más en los libros. *{amt}* kryons por el esfuerzo de no irte.',
  'La constancia tiene premio, y esta semana te toca a vos. *{amt}* kryons.',
  'Siete días no son poca cosa, aunque no parezca. *{amt}* kryons de recompensa.',
  'Midori hace cuentas cada semana y esta vez saliste ganando. *{amt}* kryons.',
  'El premio semanal no es para cualquiera, pero vos calificaste. *{amt}* kryons.',
  '*{amt}* kryons por otra semana registrada. No es la lotería, pero es algo.',
  'El jardín te debe una por quedarte. *{amt}* kryons, sin más vueltas.',
  'Cada semana que pasas aquí suma, y esta sumó *{amt}* kryons.',
  'Siete días después y seguís en pie. *{amt}* kryons por la perseverancia.',
  'No todos completan la semana, pero vos sí. *{amt}* kryons como recompensa.',
  'El premio semanal no pregunta, solo llega. *{amt}* kryons esta vez.',
  'La paciencia tiene su recompensa, aunque sea modesta. *{amt}* kryons.',
  '*{amt}* kryons por otra semana sin abandonar el jardín. Así se hace.',
  'Midori reconoce a los que se quedan, y hoy te reconoció a vos. *{amt}* kryons.',
  'Una semana más y el premio sigue llegando. *{amt}* kryons para tu bolsillo.',
  'Siete días dan para mucho, incluso para ganar *{amt}* kryons.',
  'El jardín te recompensa por seguir acá. *{amt}* kryons esta semana.',
  '*{amt}* kryons por otra vuelta al calendario. No está mal para lo que fue.',
  'La recompensa semanal es de las que valen la espera. *{amt}* kryons.',
]

const COOLDOWN_MSGS = [
  'La recompensa semanal ya la reclamaste. Vuelve en *{tiempo}* para la siguiente.',
  'No puedes reclamar dos veces en la misma semana. Faltan *{tiempo}*.',
  'El premio semanal tiene su momento justo y este no es. Espera *{tiempo}*.',
  'Paciencia, la semana no termina antes de tiempo. Quedan *{tiempo}*.',
  'Ya recibiste lo tuyo por esta semana. Vuelve en *{tiempo}*.',
]

let indiceRespuesta = 0

function tiempoRestante(secsLeft) {
  if (secsLeft >= 86400) {
    const dias = Math.floor(secsLeft / 86400)
    const horas = Math.floor((secsLeft % 86400) / 3600)
    return `${dias} día${dias > 1 ? 's' : ''} y ${horas} hora${horas > 1 ? 's' : ''}`
  }
  if (secsLeft >= 3600) {
    const horas = Math.floor(secsLeft / 3600)
    const mins = Math.ceil((secsLeft % 3600) / 60)
    return `${horas} hora${horas > 1 ? 's' : ''} y ${mins} minuto${mins > 1 ? 's' : ''}`
  }
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
  command:     ['semanal', 'semana', 'weekly'],
  tag:         'semanal',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Reclama tu recompensa semanal',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_semanal')
    const secsLeft = SEMANAL.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    addKryons(selfNum, SEMANAL.reward)
    addXp(selfNum, SEMANAL.xp)
    setUltimo(selfNum, 'ultimo_semanal', ahora)

    const texto = RESPUESTAS[indiceRespuesta % RESPUESTAS.length]
      .replace('{amt}', SEMANAL.reward.toLocaleString())
    indiceRespuesta++

    await sock.sendMessage(from, { react: { text: '📅', key: msg.key } })
    await sock.sendMessage(from, { text: texto }, { quoted: msg })
  }
}