// plugins/casarse.js

import { getUser, getRelation, getAge, createProposal, deleteProposal, setRelation, setMatrimonioFecha } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const sesiones = new Map()

export default {
  command:     'casarse',
  tag:         'casarse',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Pide matrimonio a tu pareja',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    // Solo procesar si es una respuesta válida
    if (respuesta !== '1' && respuesta !== '2' && respuesta.toLowerCase() !== 'cancelar') {
      return
    }

    if (respuesta.toLowerCase() === 'cancelar') {
      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌸 Propuesta de matrimonio cancelada.' }, { quoted: msg })
      return
    }

    if (respuesta === '1') {
      const now = Math.floor(Date.now() / 1000)

      setRelation(userNum, 'casado', sesion.from)
      setRelation(sesion.from, 'casado', userNum)
      setMatrimonioFecha(userNum, now)
      setMatrimonioFecha(sesion.from, now)

      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)

      const fromJid = `${sesion.from}@s.whatsapp.net`
      const toJid = `${userNum}@s.whatsapp.net`

      await sock.sendMessage(from, {
        text: `💍 *¡Aceptaste!*\n\n@${sesion.from} y @${userNum} ahora están casados.\n🌸 Que su amor dure para siempre.`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
      return
    }

    if (respuesta === '2') {
      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)

      const fromJid = `${sesion.from}@s.whatsapp.net`
      const toJid = `${userNum}@s.whatsapp.net`

      await sock.sendMessage(from, {
        text: `💔 @${userNum} rechazó la propuesta de @${sesion.from}... aún no es el momento.`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
      return
    }
  },

  async execute(sock, msg, { from, args, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    const selfUser = getUser(selfNum)
    if (!selfUser) return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })

    if (getAge(selfNum) < 15) {
      return sock.sendMessage(from, { text: '🌸 Necesitas tener al menos 15 años para casarte.' }, { quoted: msg })
    }

    const selfRel = getRelation(selfNum)
    if (!selfRel || selfRel.estado !== 'en_relacion') {
      return sock.sendMessage(from, { text: '🌸 Primero necesitan ser novios antes de casarse.' }, { quoted: msg })
    }

    if (!args.length) {
      const parejaPerfil = getUser(selfRel.pareja)
      const parejaNombre = parejaPerfil?.nombre || selfRel.pareja
      return sock.sendMessage(from, {
        text: `💍 ¿Quieres pedirle matrimonio a *${parejaNombre}*?\n\nSi es así, menciónalo o responde a su mensaje para continuar.`
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      const parejaPerfil = getUser(selfRel.pareja)
      const parejaNombre = parejaPerfil?.nombre || selfRel.pareja
      return sock.sendMessage(from, {
        text: `💍 ¿Quieres pedirle matrimonio a *${parejaNombre}*?\n\nMenciónala o responde a su mensaje para continuar.`
      }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfRel.pareja !== targetNum) {
      return sock.sendMessage(from, { text: '🌸 Solo puedes pedirle matrimonio a tu pareja actual.' }, { quoted: msg })
    }

    if (sesiones.has(targetNum)) {
      return sock.sendMessage(from, { text: '🌸 Tu pareja ya tiene una propuesta pendiente, espera a que responda.' }, { quoted: msg })
    }

    createProposal(selfNum, targetNum, 'casarse')
    sesiones.set(targetNum, { from: selfNum })

    const selfTag = selfJid.split('@')[0]
    const targetTag = targetNum

    const targetJid = `${targetNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      text: `💍 @${selfTag} le pidió matrimonio a @${targetTag}... ¡qué emoción! Esperemos su respuesta.`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })

    await sock.sendMessage(from, {
      text: `💍 @${targetTag}, @${selfTag} quiere casarse contigo. ¿Aceptas?\n\n*1.* Aceptar\n*2.* Rechazar\n\n_Escribe el número para responder o \"cancelar\"._`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}