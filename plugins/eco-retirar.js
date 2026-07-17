// plugins/eco-retirar.js
import { getEconomy, withdrawBanco } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const RESPUESTAS_OK = [
  'Retiraste *{amt}* kryons del banco. Ahora tienes *{total}* kryons en la cartera.',
  'Listo, *{amt}* kryons de vuelta en tu cartera. Total disponible: *{total}* kryons.',
  '*{amt}* kryons fuera del banco. Ya tienes *{total}* kryons para usar.',
  'Sacaste *{amt}* kryons. En tu cartera ahora hay *{total}* kryons en total.',
  'Hecho, *{amt}* kryons retirados. Total en cartera: *{total}* kryons.',
  'Más riesgo pero más liquidez. *{amt}* kryons fuera del banco, *{total}* en total.',
  '*{amt}* kryons ya están en tu cartera. Total: *{total}* kryons.',
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

async function procesarRetiro(sock, msg, from, selfNum, cantidadTexto) {
  const eco = getEconomy(selfNum)

  if (!cantidadTexto) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('economia'), key: msg.key } })

    if (eco.banco <= 0) {
      return sock.sendMessage(from, {
        text: 'No tienes nada guardado en el banco. No hay nada que retirar.'
      }, { quoted: msg })
    }

    return sock.sendMessage(from, {
      text: `¿Cuántos quieres retirar? Tienes *${eco.banco.toLocaleString()}* kryons en el banco.`
    }, { quoted: msg })
  }

  const texto = limpiarTexto(cantidadTexto).toLowerCase()
  let monto
  let esTodo = false

  if (texto === 'all' || texto === 'todo') {
    esTodo = true
    monto  = eco.banco
  } else {
    monto = parseInt(texto.replace(/,/g, ''))
  }

  await sock.sendMessage(from, { react: { text: global.getRandomReaction('economia'), key: msg.key } })

  if (esTodo && monto <= 0) {
    return sock.sendMessage(from, {
      text: 'No tienes nada guardado en el banco. No hay nada que retirar.'
    }, { quoted: msg })
  }

  if (isNaN(monto) || monto <= 0) {
    return sock.sendMessage(from, {
      text: 'Eso no es una cantidad válida. Dime un número real o escribe *all* para retirar todo.'
    }, { quoted: msg })
  }

  if (monto > eco.banco) {
    if (eco.banco <= 0) {
      return sock.sendMessage(from, {
        text: 'No tienes nada guardado en el banco. No hay nada que retirar.'
      }, { quoted: msg })
    }
    return sock.sendMessage(from, {
      text: `No tienes tantos kryons en el banco. Solo tienes *${eco.banco.toLocaleString()}* disponibles.`
    }, { quoted: msg })
  }

  withdrawBanco(selfNum, monto)
  const nuevaEco = getEconomy(selfNum)

  const texto2 = elegir()
    .replace('{amt}', monto.toLocaleString())
    .replace('{total}', nuevaEco.kryons.toLocaleString())

  await sock.sendMessage(from, { text: texto2 }, { quoted: msg })
}

export default {
  command:     ['wd', 'retirar'],
  tag:         'retirar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Retira kryons del banco',

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

    sesiones.delete(userNum)
    await procesarRetiro(sock, msg, from, userNum, textoTrim)
  },

  async execute(sock, msg, { from, sender, args, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    sesiones.delete(selfNum)

    const cantidadTexto = args?.[0]

    if (!cantidadTexto) {
      sesiones.set(selfNum, { msgIdIgnorar: msg.key?.id, creado: Date.now() })
      await procesarRetiro(sock, msg, from, selfNum, null)
      return
    }

    await procesarRetiro(sock, msg, from, selfNum, cantidadTexto)
  }
}