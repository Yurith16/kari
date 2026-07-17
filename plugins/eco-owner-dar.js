// plugins/owner-dar.js
import { getUser, getEconomy, addKryons } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const sesiones = new Map()

const RESPUESTAS_OK = [
  'Le di *{amt}* kryons a *{objetivo}* de la bóveda. Ahora tiene *{total}* kryons en la cartera.',
  'Listo, *{amt}* kryons para *{objetivo}* directo de la bóveda ilimitada. Total: *{total}* kryons.',
  '*{objetivo}* recibió *{amt}* kryons de mi parte. Ahora tiene *{total}* kryons en total.',
  'La bóveda nunca se acaba. Le di *{amt}* kryons a *{objetivo}*, ya tiene *{total}* en total.',
  'Hecho, *{amt}* kryons más para *{objetivo}*. Total en su cartera: *{total}* kryons.',
  '*{amt}* kryons de la nada, cortesía de la bóveda. *{objetivo}* ahora tiene *{total}* kryons.',
]

let indice = 0
function elegir() {
  const r = RESPUESTAS_OK[indice % RESPUESTAS_OK.length]
  indice++
  return r
}

function limpiarTexto(texto) {
  return (texto || '').replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '').trim()
}

function esPrefijo(texto, groupCfg) {
  const prefixes = groupCfg?.prefix ? [groupCfg.prefix] : (global.bot?.prefix || ['.'])
  return prefixes.some(p => texto.startsWith(p))
}

async function entregarKryons(sock, msg, from, targetNum, monto) {
  const targetPerfil = getUser(targetNum)
  const nombre = targetPerfil?.nombre || targetNum

  addKryons(targetNum, monto)
  const nuevaEco = getEconomy(targetNum)

  const texto = elegir()
    .replace('{amt}', monto.toLocaleString())
    .replace('{objetivo}', nombre)
    .replace('{total}', (nuevaEco?.kryons || 0).toLocaleString())

  await sock.sendMessage(from, { react: { text: global.getRandomReaction('economia'), key: msg.key } })
  await sock.sendMessage(from, { text: texto }, { quoted: msg })
}

export default {
  command:     ['dar', 'give'],
  tag:         'dar',
  categoria:   'owner',
  owner:       true,
  group:       false,
  nsfw:        false,
  descripcion: 'Entrega kryons de la bóveda ilimitada de Midori',

  async onMessage(sock, msg, { from, text, userNum, groupCfg }) {
    if (!userNum) return
    if (msg.key?.fromMe) return
    if (!sesiones.has(userNum)) return

    const sesion = sesiones.get(userNum)

    if (Date.now() - sesion.creado > 60000) {
      sesiones.delete(userNum)
      return
    }

    const textoTrim = limpiarTexto(text)
    if (!textoTrim) return

    if (msg.key?.id === sesion.msgIdIgnorar) return
    if (esPrefijo(textoTrim, groupCfg)) return

    const monto = parseInt(textoTrim.replace(/,/g, ''))

    if (isNaN(monto) || monto <= 0) {
      await sock.sendMessage(from, {
        text: 'Eso no es una cantidad válida. Dime un número real.'
      }, { quoted: msg })
      return
    }

    sesiones.delete(userNum)
    await entregarKryons(sock, msg, from, sesion.targetNum, monto)
  },

  async execute(sock, msg, { from, sender, args, isGroup, groupCfg }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    sesiones.delete(selfNum)

    const target = await resolveTarget(sock, msg, args).catch(() => null)

    if (!target?.num) {
      await sock.sendMessage(from, {
        text: 'Etiqueta a alguien o responde su mensaje para darle kryons de la bóveda.'
      }, { quoted: msg })
      return
    }

    const targetNum = target.num
    const targetPerfil = getUser(targetNum)

    if (!targetPerfil) {
      await sock.sendMessage(from, {
        text: 'Ese usuario no tiene perfil conmigo. No puedo darle nada así.'
      }, { quoted: msg })
      return
    }

    const cantidadArg = args.find(a => /^[\d,]+$/.test(a))

    if (!cantidadArg) {
      await sock.sendMessage(from, { react: { text: global.getRandomReaction('economia'), key: msg.key } })
      sesiones.set(selfNum, {
        targetNum,
        msgIdIgnorar: msg.key?.id,
        creado: Date.now()
      })
      await sock.sendMessage(from, {
        text: `¿Cuántos kryons quieres darle a *${targetPerfil.nombre}* de la bóveda?`
      }, { quoted: msg })
      return
    }

    const monto = parseInt(cantidadArg.replace(/,/g, ''))

    if (isNaN(monto) || monto <= 0) {
      await sock.sendMessage(from, {
        text: 'Eso no es una cantidad válida.'
      }, { quoted: msg })
      return
    }

    await entregarKryons(sock, msg, from, targetNum, monto)
  }
}