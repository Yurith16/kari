// plugins/eco-crimen.js
import { addKryons, removeKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { CRIMEN } from '../settings/economia.js'

const RESPUESTAS_EXITO = [
  'Saliste limpio esta vez. *{amt}* kryons que no eran tuyos y ahora sí lo son.',
  'No sé cómo lo hiciste, pero funcionó. *{amt}* kryons en tu bolsillo.',
  'El crimen pagó hoy. *{amt}* kryons y nadie vio nada.',
  'Entraste, tomaste lo que no era tuyo y saliste sin problemas. *{amt}* kryons.',
  'Esta vez todo salió según el plan. *{amt}* kryons y sin rastros.',
  'No todos tienen esa suerte, pero hoy la tuviste. *{amt}* kryons.',
  'Rápido, silencioso y efectivo. *{amt}* kryons como resultado.',
  'El plan era arriesgado pero funcionó. *{amt}* kryons para demostrarlo.',
  'Nadie te vio, nadie sospechó. *{amt}* kryons bien robados.',
  'Saliste con *{amt}* kryons y con la conciencia que ya tenías antes. Bien hecho.',
  'No siempre sale así, pero hoy sí. *{amt}* kryons y a seguir.',
  'El crimen de hoy rindió *{amt}* kryons. No estés tan orgulloso, pero tampoco tan mal.',
  'Entraste como si nada y saliste con *{amt}* kryons. Impresionante, la verdad.',
  'Todo salió bien esta vez. *{amt}* kryons y nadie preguntó nada.',
  'Riesgo calculado, resultado positivo. *{amt}* kryons.',
  'No fui yo quien te enseñó esto, pero saliste con *{amt}* kryons así que algo sabes.',
  'El plan tenía sus huecos pero nadie los notó. *{amt}* kryons.',
  'Esta vez la suerte estuvo de tu lado. *{amt}* kryons sin consecuencias.',
  'Entraste, saliste, ganaste. *{amt}* kryons y sin dramas.',
  'No era el crimen del siglo, pero *{amt}* kryons no están mal para lo que fue.',
  'Lo lograste sin que nadie se diera cuenta. *{amt}* kryons tuyos ahora.',
  'Saliste airoso esta vez. *{amt}* kryons y con algo de adrenalina de más.',
  'El crimen pagó *{amt}* kryons hoy. No te acostumbres demasiado.',
  'Rápido y sin dejar rastros. *{amt}* kryons como recompensa.',
  'Hoy la suerte estuvo contigo. *{amt}* kryons y ni una sola pregunta.',
]

const RESPUESTAS_FALLO = [
  'Te atraparon con las manos en la masa. Perdiste *{pen}* kryons y la dignidad, en ese orden.',
  'El plan falló desde el principio y tú lo sabías. *{pen}* kryons menos en tu cartera.',
  'No era tu día para el crimen. Perdiste *{pen}* kryons y eso es lo más suave que te podría pasar.',
  'Te vieron, te siguieron y te cobraron. *{pen}* kryons de penalización.',
  'Salió mal. No hay mucho más que decir — perdiste *{pen}* kryons.',
  'El crimen no siempre paga, hoy fue uno de esos días. *{pen}* kryons menos.',
  'Qué pena ajena, la verdad. Te cacharon y perdiste *{pen}* kryons.',
  'Fallaste en el momento menos indicado. *{pen}* kryons de consecuencia.',
  'No fue tu mejor actuación. Perdiste *{pen}* kryons por ese intento.',
  'Te delataste solo, básicamente. *{pen}* kryons de castigo.',
  'El plan tenía más huecos de lo que pensabas. *{pen}* kryons perdidos.',
  'Esta vez no funcionó y costó *{pen}* kryons descubrirlo.',
  'Confiaste demasiado en tu suerte y mira cómo quedó. *{pen}* kryons menos.',
  'Te vieron desde el principio y dejaron que te hundieras solo. *{pen}* kryons.',
  'Salió mal desde el momento en que empezaste. *{pen}* kryons de lección.',
  'No todo crimen sale bien, este es el ejemplo. *{pen}* kryons perdidos.',
  'Fallaste y encima te cobraron. *{pen}* kryons de penalización.',
  'La próxima vez planea mejor, porque hoy perdiste *{pen}* kryons sin razón.',
  'El crimen de hoy salió caro — *{pen}* kryons que ya no tienes.',
  'Te atraparon antes de que pudieras hacer nada. *{pen}* kryons menos.',
  'No era el plan más brillante y los resultados lo confirman. *{pen}* kryons.',
  'Fallaste y punto. *{pen}* kryons de consecuencia, sin más explicaciones.',
  'Hoy no era tu día para el crimen, claramente. *{pen}* kryons perdidos.',
  'El intento fue valiente, el resultado no tanto. *{pen}* kryons menos.',
  'Te cacharon y lo peor es que ni fue difícil hacerlo. *{pen}* kryons de castigo.',
]

const COOLDOWN_MSGS = [
  'Acabas de hacer algo cuestionable, espera un poco antes del siguiente intento. Vuelve en *{tiempo}*.',
  'Todavía estás en el radar después del último intento. Espera *{tiempo}*.',
  'No puedes cometer un crimen cada cinco minutos, eso levanta sospechas. Faltan *{tiempo}*.',
  'Date un tiempo entre un crimen y otro. Quedan *{tiempo}*.',
  'El siguiente intento está disponible en *{tiempo}*. Mientras tanto, compórtate.',
]

let indiceExito = 0
let indiceFallo = 0

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
  command:     ['crimen', 'crime'],
  tag:         'crimen',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Intenta cometer un crimen para ganar kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_crimen')
    const secsLeft = CRIMEN.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    setUltimo(selfNum, 'ultimo_crimen', ahora)

    // 50% de probabilidad de éxito
    const exito = Math.random() < 0.5

    if (exito) {
      const amt = Math.floor(Math.random() * (CRIMEN.max - CRIMEN.min + 1)) + CRIMEN.min
      addKryons(selfNum, amt)
      addXp(selfNum, CRIMEN.xp)

      const texto = RESPUESTAS_EXITO[indiceExito % RESPUESTAS_EXITO.length]
        .replace('{amt}', amt.toLocaleString())
      indiceExito++

      await sock.sendMessage(from, { react: { text: '🦹', key: msg.key } })
      await sock.sendMessage(from, { text: texto }, { quoted: msg })
    } else {
      removeKryons(selfNum, CRIMEN.penalidad)

      const texto = RESPUESTAS_FALLO[indiceFallo % RESPUESTAS_FALLO.length]
        .replace('{pen}', CRIMEN.penalidad.toLocaleString())
      indiceFallo++

      await sock.sendMessage(from, { react: { text: '🚔', key: msg.key } })
      await sock.sendMessage(from, { text: texto }, { quoted: msg })
    }
  }
}