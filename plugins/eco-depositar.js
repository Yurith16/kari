// plugins/eco-depositar.js
import { getEconomy, depositBanco } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const RESPUESTAS_OK = [
  'Depositaste *{amt}* kryons al banco. Ahora tienes *{total}* kryons guardados en total.',
  'Listo, *{amt}* kryons más seguros en el banco. Ya son *{total}* en total ahí guardados.',
  '*{amt}* kryons a salvo en el banco. Tu total guardado ahora es de *{total}*.',
  'Guardaste *{amt}* kryons. En el banco ya tienes *{total}* kryons en total.',
  'Hecho, *{amt}* kryons depositados. Total en el banco: *{total}* kryons.',
  'Menos riesgo de que te los roben ahora. *{amt}* kryons al banco, *{total}* en total.',
  '*{amt}* kryons guardados donde nadie los puede tocar. Total: *{total}* kryons.',
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

async function procesarDeposito(sock, msg, from, selfNum, cantidadTexto) {
  const eco = getEconomy(selfNum)

  if (!cantidadTexto) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('economia'), key: msg.key } })

    // Ya tiene todo en el banco, no hay nada que preguntar
    if (eco.kryons <= 0) {
      return sock.sendMessage(from, {
        text: 'Ya tienes todo guardado en el banco. No queda nada en tu cartera para depositar.'
      }, { quoted: msg })
    }

    return sock.sendMessage(from, {
      text: `¿Cuántos quieres depositar? Tienes *${eco.kryons.toLocaleString()}* kryons fuera del banco.`
    }, { quoted: msg })
  }

  const texto = limpiarTexto(cantidadTexto).toLowerCase()
  let monto
  let esTodo = false

  if (texto === 'all' || texto === 'todo') {
    esTodo = true
    monto  = eco.kryons
  } else {
    monto = parseInt(texto.replace(/,/g, ''))
  }

  await sock.sendMessage(from, { react: { text: global.getRandomReaction('economia'), key: msg.key } })

  if (esTodo && monto <= 0) {
    return sock.sendMessage(from, {
      text: 'Ya tienes todo guardado en el banco. No queda nada en tu cartera para depositar.'
    }, { quoted: msg })
  }

  if (isNaN(monto) || monto <= 0) {
    return sock.sendMessage(from, {
      text: 'Eso no es una cantidad válida. Dime un número real o escribe *all* para depositar todo.'
    }, { quoted: msg })
  }

  if (monto > eco.kryons) {
    if (eco.kryons <= 0) {
      return sock.sendMessage(from, {
        text: 'No tienes nada en la cartera, todo lo tuyo ya está guardado en el banco.'
      }, { quoted: msg })
    }
    return sock.sendMessage(from, {
      text: `No tienes tantos kryons fuera del banco. Solo tienes *${eco.kryons.toLocaleString()}* disponibles.`
    }, { quoted: msg })
  }

  depositBanco(selfNum, monto)
  const nuevaEco = getEconomy(selfNum)

  const texto2 = elegir()
    .replace('{amt}', monto.toLocaleString())
    .replace('{total}', nuevaEco.banco.toLocaleString())

  await sock.sendMessage(from, { text: texto2 }, { quoted: msg })
}

export default {
  command:     ['dep', 'depositar'],
  tag:         'depositar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Deposita kryons en el banco',

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
    await procesarDeposito(sock, msg, from, userNum, textoTrim)
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
      await procesarDeposito(sock, msg, from, selfNum, null)
      return
    }

    await procesarDeposito(sock, msg, from, selfNum, cantidadTexto)
  }
}