// plugins/casarse.js
import { getUser, getRelation, getAge, createProposal, deleteProposal, setRelation, setMatrimonioFecha } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const sesiones = new Map()

export default {
  command: 'casarse',
  tag: 'casarse',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Pide matrimonio a tu novio/a',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (respuesta !== '1' && respuesta !== '2' && respuesta.toLowerCase() !== 'cancelar') return

    if (respuesta.toLowerCase() === 'cancelar') {
      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)
      return sock.sendMessage(from, { text: '💔 Cancelaron la boda... Midori guarda el anillo para otra ocasión.' }, { quoted: msg })
    }

    const fromJid = `${sesion.from}@s.whatsapp.net`
    const toJid = `${userNum}@s.whatsapp.net`

    if (respuesta === '1') {
      const now = Math.floor(Date.now() / 1000)
      setRelation(userNum, 'casado', sesion.from)
      setRelation(sesion.from, 'casado', userNum)
      setMatrimonioFecha(userNum, now)
      setMatrimonioFecha(sesion.from, now)
      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)

      return sock.sendMessage(from, {
        text: `💍 ¡Aceptó! @${sesion.from} y @${userNum} ahora están casados. Que la felicidad les dure toda la vida. ✨`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
    }

    if (respuesta === '2') {
      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)

      return sock.sendMessage(from, {
        text: `💔 @${userNum} dijo que no. @${sesion.from} tendrá que esperar un poco más.`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
    }
  },

  async execute(sock, msg, { from, args, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    const selfUser = getUser(selfNum)
    if (!selfUser) return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })

    if (getAge(selfNum) < 15) {
      return sock.sendMessage(from, { text: '> 🩷 Eres muy pequeño para casarte, necesitas al menos 15 años.' }, { quoted: msg })
    }

    const selfRel = getRelation(selfNum)
    if (!selfRel || selfRel.estado !== 'en_relacion') {
      return sock.sendMessage(from, { text: '> 🩷 Primero necesitan ser novios. Un paso a la vez.' }, { quoted: msg })
    }

    if (!args.length) {
      const parejaPerfil = getUser(selfRel.pareja)
      const parejaNombre = parejaPerfil?.nombre || selfRel.pareja
      return sock.sendMessage(from, {
        text: `💍 ¿Quieres casarte con *${parejaNombre}*? Menciónale o responde a su mensaje.`
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      const parejaPerfil = getUser(selfRel.pareja)
      const parejaNombre = parejaPerfil?.nombre || selfRel.pareja
      return sock.sendMessage(from, {
        text: `💍 ¿Le pides matrimonio a *${parejaNombre}*? Menciónale o responde a su mensaje.`
      }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfRel.pareja !== targetNum) {
      return sock.sendMessage(from, { text: '> 🩷 Solo puedes pedirle matrimonio a tu pareja actual.' }, { quoted: msg })
    }

    if (sesiones.has(targetNum)) {
      return sock.sendMessage(from, { text: '> 🩷 Tu pareja ya tiene una propuesta pendiente, dale tiempo.' }, { quoted: msg })
    }

    createProposal(selfNum, targetNum, 'casarse')
    sesiones.set(targetNum, { from: selfNum })

    const selfTag = selfJid.split('@')[0]
    const targetJid = `${targetNum}@s.whatsapp.net`

    // Calcular tiempo de noviazgo
    const noviazgoFecha = selfRel.noviazgo_fecha || 0
    const ahora = Math.floor(Date.now() / 1000)
    const diasJuntos = noviazgoFecha > 0 ? Math.floor((ahora - noviazgoFecha) / 86400) : 0

    let tiempoJuntos = ''
    if (diasJuntos > 365) {
      const anios = Math.floor(diasJuntos / 365)
      tiempoJuntos = `después de ${anios} año${anios > 1 ? 's' : ''} de noviazgo`
    } else if (diasJuntos > 30) {
      const meses = Math.floor(diasJuntos / 30)
      tiempoJuntos = `después de ${meses} mes${meses > 1 ? 'es' : ''} de noviazgo`
    } else if (diasJuntos > 0) {
      tiempoJuntos = `después de ${diasJuntos} día${diasJuntos > 1 ? 's' : ''} de noviazgo`
    } else {
      tiempoJuntos = 'hoy mismo'
    }

    await sock.sendMessage(from, {
      text: `💍 @${selfTag} decidió dar el gran paso y le pidió matrimonio a @${targetNum} ${tiempoJuntos}. 🥹\n\n@${targetNum} escribe *1* para aceptar o *2* para rechazar.`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}