// plugins/eco-diario.js
import { addKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { DIARIO } from '../settings/economia.js'

const RESPUESTAS = [
  'Un día más en el jardín y *{amt}* kryons de recompensa por seguir aquí. No está nada mal.',
  'Midori notó que volviste otro día más. Toma *{amt}* kryons, te los ganaste.',
  'La constancia tiene su premio, aunque sea uno pequeño. *{amt}* kryons por hoy.',
  'Otro día, otra recompensa. *{amt}* kryons que no estaban y ahora sí.',
  'No todos los días son buenos, pero hoy al menos hay *{amt}* kryons en tu bolsillo.',
  'Seguís apareciendo y eso ya es algo. *{amt}* kryons por no haberte ido todavía.',
  'El jardín te da lo suyo cada día que vienes. Hoy son *{amt}* kryons.',
  '*{amt}* kryons por un día más. No es mucho, pero es algo.',
  'La rutina a veces paga, como hoy: *{amt}* kryons por estar aquí.',
  'Un día más significa una recompensa más. *{amt}* kryons para vos.',
  'No faltaste hoy y eso tiene su mérito. *{amt}* kryons, como debe ser.',
  'El jardín no se cuida solo, pero vos estuviste. *{amt}* kryons por eso.',
  'Pasaste otro día sin irte y Midori lo sabe. *{amt}* kryons, sin más vueltas.',
  '*{amt}* kryons por otro día registrado. No es la lotería, pero es seguro.',
  'El premio diario no falla, y hoy te toca a vos. *{amt}* kryons.',
  'Cada día cuenta, y este contó *{amt}* kryons.',
  'Volviste y eso ya es suficiente para ganarte *{amt}* kryons.',
  'No hubo que rogar por la recompensa. *{amt}* kryons, directo y sin vueltas.',
  'El jardín recompensa a los que se quedan. Hoy: *{amt}* kryons.',
  '*{amt}* kryons por estar otro día más. Mañana hay otro, si volvés.',
  'La recompensa diaria no pregunta, solo da. *{amt}* kryons.',
  'No te fuiste, no te escondiste. *{amt}* kryons por estar presente.',
  'El premio de hoy es *{amt}* kryons. Lo de mañana ya se verá.',
  'Un día más en el jardín siempre trae algo. *{amt}* kryons esta vez.',
  '*{amt}* kryons por otro día sin faltar. Así de simple.',
]

const COOLDOWN_MSGS = [
  'Ya pasaste por aquí hoy. Vuelve en *{tiempo}* para tu siguiente recompensa diaria.',
  'La recompensa diaria es justo lo que dice: diaria. Faltan *{tiempo}*.',
  'No puedes reclamar dos veces el mismo día. Quedan *{tiempo}*.',
  'Paciencia, el premio diario llega solo una vez. Vuelve en *{tiempo}*.',
  'Apenas pasaron unas horas desde la última vez. Espera *{tiempo}*.',
]

let indiceRespuesta = 0

function tiempoRestante(secsLeft) {
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
  command:     ['diario', 'daily'],
  tag:         'diario',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Reclama tu recompensa diaria',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_diario')
    const secsLeft = DIARIO.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    addKryons(selfNum, DIARIO.reward)
    addXp(selfNum, DIARIO.xp)
    setUltimo(selfNum, 'ultimo_diario', ahora)

    const texto = RESPUESTAS[indiceRespuesta % RESPUESTAS.length]
      .replace('{amt}', DIARIO.reward.toLocaleString())
    indiceRespuesta++

    await sock.sendMessage(from, { react: { text: '📅', key: msg.key } })
    await sock.sendMessage(from, { text: texto }, { quoted: msg })
  }
}