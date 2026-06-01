import fs   from 'fs'
import path from 'path'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { createSubbot, getSubbot, countActiveSubbots } from '../core/sqlite.js'
import { startSubbot, subbotSocks } from '../core/subbot-manager.js'

const SESIONES_DIR = path.join(process.cwd(), 'sesiones-sb')

function normalizeNumber(num) {
  const pn = parsePhoneNumber(String(num))
  return (pn.valid ? pn.number : num).replace(/\D/g, '')
}

export default {
  command: ['code', 'subbot', 'serbot'],
  tag: 'subbot',
  categoria: 'owner',
  owner: true,
  group: false,
  nsfw: false,
  descripcion: 'Conecta un nuevo subbot',

  async execute(sock, msg, { from, args }) {
    const numero = args[0]

    if (!numero) {
      await sock.sendMessage(from, {
        text: `🌿 Usa el comando así:\n*.code NUMERO*\n\nEjemplo: .code 50412345678`
      }, { quoted: msg })
      return
    }

    const numLimpio = normalizeNumber(numero)

    if (numLimpio.length < 8) {
      await sock.sendMessage(from, {
        text: '🌸 Número inválido. Asegúrate de incluir el código de país.'
      }, { quoted: msg })
      return
    }

    const maxActivos = global.bot?.subbots?.maxActivos ?? 3
    const total      = countActiveSubbots()

    if (total >= maxActivos) {
      await sock.sendMessage(from, {
        text: `⚠️ Límite alcanzado. Solo se permiten *${maxActivos}* subbots activos.`
      }, { quoted: msg })
      return
    }

    const existente = getSubbot(numLimpio)
    if (existente) {
      await sock.sendMessage(from, {
        text: `⚠️ El número *${numLimpio}* ya tiene un subbot registrado.`
      }, { quoted: msg })
      return
    }

    const sesionDir = path.join(SESIONES_DIR, numLimpio)

    await sock.sendMessage(from, {
      text: `⏳ Solicitando código de emparejamiento para *${numLimpio}*...`
    }, { quoted: msg })

    createSubbot(numLimpio, '', `Subbot-${numLimpio}`, sesionDir)

    await startSubbot(numLimpio, sock).catch(async err => {
      await sock.sendMessage(from, {
        text: `❌ Error al conectar: ${err.message}`
      }, { quoted: msg })
    })
  }
}