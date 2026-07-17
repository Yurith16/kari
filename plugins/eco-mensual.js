// plugins/eco-mensual.js
import { addKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { MENSUAL } from '../settings/economia.js'

const RESPUESTAS = [
  'Un mes entero sin irte del jardín. Eso ya es compromiso de verdad. Toma *{amt}* kryons, bien merecidos.',
  'Treinta días después y seguís acá. No sé si felicitarte o preocuparme, pero *{amt}* kryons son tuyos.',
  'El premio mensual no es para cualquiera, hay que quedarse y vos lo hiciste. *{amt}* kryons.',
  'Midori hizo las cuentas del mes y saliste ganando. *{amt}* kryons por la constancia.',
  'Un mes sin faltar es más de lo que muchos pueden decir. *{amt}* kryons como reconocimiento.',
  'El jardín recompensa a los que se quedan de verdad. *{amt}* kryons este mes.',
  'Pasaron cuatro semanas y seguís plantado aquí. Eso vale *{amt}* kryons.',
  '*{amt}* kryons por otro mes registrado. No todos llegan tan lejos.',
  'La recompensa mensual llegó y no es poca cosa. *{amt}* kryons para vos.',
  'Un mes en el jardín no se cumple solo. *{amt}* kryons por el esfuerzo.',
  'El calendario dio otra vuelta y vos seguís. *{amt}* kryons como premio.',
  'Midori sabe quiénes se quedan y quiénes no. Vos estás en la primera lista. *{amt}* kryons.',
  'La constancia de un mes entero tiene su peso. *{amt}* kryons en tu bolsillo.',
  'No es fácil quedarse tanto tiempo, pero vos lo hiciste. *{amt}* kryons.',
  '*{amt}* kryons por otro mes sin abandonar. El jardín te lo agradece.',
  'La recompensa mensual es de las que valen la espera. *{amt}* kryons.',
  'Treinta días dan para mucho, incluso para ganar *{amt}* kryons.',
  'El premio del mes ya está aquí. *{amt}* kryons, sin más vueltas.',
  'Cada mes que pasa dejas huella en el jardín. *{amt}* kryons por eso.',
  'Midori no olvida a los que se quedan un mes entero. *{amt}* kryons para vos.',
  'Un mes más y la recompensa sigue llegando. *{amt}* kryons esta vez.',
  'El jardín te debe una por tanta paciencia. *{amt}* kryons, como debe ser.',
  '*{amt}* kryons por completar otro mes. No es poco, aunque no lo parezca.',
  'La perseverancia tiene premio, y este mes te toca. *{amt}* kryons.',
  'Cuatro semanas después y el premio mensual es tuyo. *{amt}* kryons.',
]

const COOLDOWN_MSGS = [
  'La recompensa mensual ya la reclamaste este mes. Vuelve en *{tiempo}*.',
  'No puedes reclamar dos veces en el mismo mes. Faltan *{tiempo}*.',
  'El premio mensual tiene su fecha y todavía no llega. Espera *{tiempo}*.',
  'Paciencia, el mes no se acaba antes de tiempo. Quedan *{tiempo}*.',
  'Ya recibiste lo tuyo por este mes. Vuelve en *{tiempo}*.',
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
  command:     ['mensual', 'monthly'],
  tag:         'mensual',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Reclama tu recompensa mensual',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_mensual')
    const secsLeft = MENSUAL.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    addKryons(selfNum, MENSUAL.reward)
    addXp(selfNum, MENSUAL.xp)
    setUltimo(selfNum, 'ultimo_mensual', ahora)

    const texto = RESPUESTAS[indiceRespuesta % RESPUESTAS.length]
      .replace('{amt}', MENSUAL.reward.toLocaleString())
    indiceRespuesta++

    await sock.sendMessage(from, { react: { text: '📅', key: msg.key } })
    await sock.sendMessage(from, { text: texto }, { quoted: msg })
  }
}