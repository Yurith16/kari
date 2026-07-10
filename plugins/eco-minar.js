// plugins/eco-minar.js
import { getEconomy, addKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { MINAR } from '../settings/economia.js'

const RESPUESTAS = [
  'Estuviste un rato largo ahí abajo y al final valió la pena. Ganaste *{amt}* kryons.',
  'No fue fácil, pero lo lograste. *{amt}* kryons encontrados en las profundidades.',
  'Volviste con las manos llenas esta vez. *{amt}* kryons, nada mal para un día de trabajo.',
  'Sudaste la gota gorda ahí adentro, pero aquí están — *{amt}* kryons bien ganados.',
  'Las minas no perdonan, pero hoy sí tuvieron algo para ti. *{amt}* kryons.',
  'Otra jornada en las profundidades. Saliste con *{amt}* kryons y sin rasguños, eso cuenta.',
  'No siempre el esfuerzo paga igual, pero hoy sí. *{amt}* kryons para tu bolsillo.',
  'Ahí abajo hay de todo menos luz, pero encontraste lo que ibas a buscar. *{amt}* kryons.',
  'Las minas no te lo ponen fácil nunca, pero esta vez cooperaron. *{amt}* kryons.',
]

const COOLDOWN_MSGS = [
  'Acabas de salir de las minas, date un respiro. Vuelve en *{tiempo}*.',
  'Todavía tienes tierra en las manos de la última vez. Espera *{tiempo}* más.',
  'Las minas no van a ningún lado, tranquilo. Faltan *{tiempo}* para volver.',
  'Ya irás de vuelta, pero primero descansa un poco. Quedan *{tiempo}*.',
  'No seas ansioso, las minas siguen ahí. Vuelve en *{tiempo}*.',
]

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
  command:     ['minar', 'mine'],
  tag:         'minar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Extrae kryons de las minas',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_minar')
    const secsLeft = MINAR.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    const amt = Math.floor(Math.random() * (MINAR.max - MINAR.min + 1)) + MINAR.min

    addKryons(selfNum, amt)
    addXp(selfNum, MINAR.xp)
    setUltimo(selfNum, 'ultimo_minar', ahora)

    await sock.sendMessage(from, { react: { text: '⛏️', key: msg.key } })
    await sock.sendMessage(from, {
      text: elegir(RESPUESTAS).replace('{amt}', amt.toLocaleString())
    }, { quoted: msg })
  }
}