// plugins/eco-cofre.js
import { addKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { COFRE } from '../settings/economia.js'

const RESPUESTAS = [
  'Abriste el cofre y había *{amt}* kryons adentro. No está mal para lo que esperabas.',
  'El cofre tenía *{amt}* kryons guardados. Alguien los dejó ahí y tú los encontraste.',
  'Sorpresa o no, el cofre tenía *{amt}* kryons. Ya son tuyos.',
  '*{amt}* kryons en el cofre de hoy. No todos los días hay tanto, aprovéchalo.',
  'El cofre no decepciona esta vez. *{amt}* kryons para ti.',
  'Abriste, encontraste, ganaste. *{amt}* kryons del cofre de hoy.',
  'El cofre estaba esperando que llegaras. *{amt}* kryons adentro.',
  'No todos los cofres tienen lo mismo, pero este tenía *{amt}* kryons y ya son tuyos.',
  '*{amt}* kryons. No es un tesoro legendario, pero algo es algo.',
  'Cofre abierto, *{amt}* kryons cobrados. Así de simple.',
  'El cofre de hoy tenía *{amt}* kryons guardados. Buen momento para abrirlo.',
  'Llegaste en el momento justo. *{amt}* kryons en el cofre.',
  'No siempre hay lo mismo adentro, pero hoy había *{amt}* kryons y eso alcanza.',
  'El cofre entregó *{amt}* kryons sin resistencia. Bien por ti.',
  '*{amt}* kryons encontrados. No preguntes de dónde salieron, solo guárdalos.',
  'Abriste el cofre y ahí estaban — *{amt}* kryons esperándote.',
  'Otro cofre, otro resultado. Esta vez: *{amt}* kryons.',
  'El cofre no decepciona cuando uno lo abre a tiempo. *{amt}* kryons.',
  'Había *{amt}* kryons adentro. No era el tesoro del siglo, pero no se rechaza.',
  '*{amt}* kryons del cofre de hoy. Ya sabes dónde encontrarme mañana.',
  'El cofre habló y dijo *{amt}* kryons. No hay mucho más que agregar.',
  'Abriste y encontraste *{amt}* kryons. El cofre cumplió su parte.',
  'No todos abren sus cofres, pero tú sí. *{amt}* kryons como recompensa.',
  '*{amt}* kryons guardados en el cofre de hoy. Ya son parte de tu fortuna.',
  'El cofre tenía exactamente lo que necesitabas — *{amt}* kryons.',
]

const COOLDOWN_MSGS = [
  'Este cofre ya lo abriste, el siguiente aparece en *{tiempo}*.',
  'Paciencia, el próximo cofre llega en *{tiempo}*.',
  'Ya abriste el cofre de hoy, vuelve en *{tiempo}* por el siguiente.',
  'El cofre se está recargando. Quedan *{tiempo}*.',
  'Faltan *{tiempo}* para que aparezca el próximo cofre.',
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
  command:     ['cofre', 'chest'],
  tag:         'cofre',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Abre un cofre y obtén kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_cofre')
    const secsLeft = COFRE.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    const amt = Math.floor(Math.random() * (COFRE.max - COFRE.min + 1)) + COFRE.min

    addKryons(selfNum, amt)
    addXp(selfNum, COFRE.xp)
    setUltimo(selfNum, 'ultimo_cofre', ahora)

    const texto = RESPUESTAS[indiceRespuesta % RESPUESTAS.length].replace('{amt}', amt.toLocaleString())
    indiceRespuesta++

    await sock.sendMessage(from, { react: { text: '📦', key: msg.key } })
    await sock.sendMessage(from, { text: texto }, { quoted: msg })
  }
}