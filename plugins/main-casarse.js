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

    if (respuesta !== '1' && respuesta !== '2' && respuesta.toLowerCase() !== 'cancelar') return

    if (respuesta.toLowerCase() === 'cancelar') {
      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)
      return sock.sendMessage(from, { text: '🌸 Ay... al final cancelaron la propuesta. Me había hecho ilusiones. 🥺' }, { quoted: msg })
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
        text: `💍 *¡SIII, DIJO QUE SÍ!* 🎉\n\n@${sesion.from} y @${userNum} acaban de unirse en matrimonio. ¡Que viva el amor! 🌸✨`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
    }

    if (respuesta === '2') {
      deleteProposal(sesion.from, userNum, 'casarse')
      sesiones.delete(userNum)

      return sock.sendMessage(from, {
        text: `💔 Ouch... @${userNum} rechazó la propuesta de @${sesion.from}. Mi corazoncito no estaba listo para este drama... 🥺`,
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
      return sock.sendMessage(from, { text: '🌸 ¡Ey! Estás muy chiquito para esto, necesitas al menos 15 años. 🤭' }, { quoted: msg })
    }

    const selfRel = getRelation(selfNum)
    if (!selfRel || selfRel.estado !== 'en_relacion') {
      return sock.sendMessage(from, { text: '🌸 ¿Casarse? ¡Pero si ni siquiera son novios todavía! Primero el orden... 🥰' }, { quoted: msg })
    }

    if (!args.length) {
      const parejaPerfil = getUser(selfRel.pareja)
      const parejaNombre = parejaPerfil?.nombre || selfRel.pareja
      return sock.sendMessage(from, {
        text: `💍 ¿Llegó el gran momento con *${parejaNombre}*? 💕\nMenciónalo o responde a su mensaje para dar el paso.`
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      const parejaPerfil = getUser(selfRel.pareja)
      const parejaNombre = parejaPerfil?.nombre || selfRel.pareja
      return sock.sendMessage(from, {
        text: `💍 ¿Quieres pedirle matrimonio a *${parejaNombre}*?\nMenciónala o responde a su mensaje.`
      }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfRel.pareja !== targetNum) {
      return sock.sendMessage(from, { text: '🌸 ¡Qué descaro! Solo puedes pedirle matrimonio a tu pareja actual. 🤭' }, { quoted: msg })
    }

    if (sesiones.has(targetNum)) {
      return sock.sendMessage(from, { text: '🌸 Espera un poquito, tu pareja ya tiene una propuesta pendiente de responder. 👀' }, { quoted: msg })
    }

    createProposal(selfNum, targetNum, 'casarse')
    sesiones.set(targetNum, { from: selfNum })

    const selfTag = selfJid.split('@')[0]
    const targetJid = `${targetNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      text: `💍 @${targetNum}, ¡@${selfTag} te está pidiendo matrimonio en este momento! 😳 ¿Qué vas a decidir?\n\n*1.* Aceptar 💍\n*2.* Rechazar 💔\n\n_Responde con el número o "cancelar"._`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}