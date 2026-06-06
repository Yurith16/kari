// plugins/novio.js

import { createProposal, getUser, getRelation, getAge, deleteProposal, setRelation, setNoviazgoFecha } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const sesiones = new Map()

export default {
  command:     ['novio', 'novia'],
  tag:         'novio',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Pide a alguien que sea tu novio/a',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (respuesta !== '1' && respuesta !== '2' && respuesta.toLowerCase() !== 'cancelar') return

    if (respuesta.toLowerCase() === 'cancelar') {
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)
      return sock.sendMessage(from, { text: '🌸 Ay... cancelaron la propuesta. Me cortaron toda la inspiración. 🥺' }, { quoted: msg })
    }

    const fromJid = `${sesion.from}@s.whatsapp.net`
    const toJid = `${userNum}@s.whatsapp.net`

    if (respuesta === '1') {
      const now = Math.floor(Date.now() / 1000)
      
      setRelation(userNum, 'en_relacion', sesion.from)
      setRelation(sesion.from, 'en_relacion', userNum)
      setNoviazgoFecha(userNum, now)
      setNoviazgoFecha(sesion.from, now)
      
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)

      return sock.sendMessage(from, {
        text: `💖 *¡TENEMOS NUEVOS NOVIOS!* 🎉\n\n@${sesion.from} y @${userNum} acaban de empezar una relación. ¡Que les dure mucho! 🌸✨`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
    }

    if (respuesta === '2') {
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)

      return sock.sendMessage(from, {
        text: `💔 El amor es difícil... @${userNum} rechazó la propuesta de @${sesion.from}. Me dolió hasta a mí... 🥺`,
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
      return sock.sendMessage(from, { text: '🌸 ¡Ey! Estás muy chiquito para los noviazgos, necesitas al menos 15 años. 🤭' }, { quoted: msg })
    }

    const selfRel = getRelation(selfNum)
    if (selfRel?.estado && selfRel.estado !== 'soltero') {
      return sock.sendMessage(from, { text: '🌸 Pero si ya tienes dueño/a... no juegues con fuego. 🤭' }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, { text: global.messages.userNeeded }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: '🌸 ¿Pedirte noviazgo a ti mismo? Tan solo no estás, aquí me tienes a mí. 🥰' }, { quoted: msg })
    }

    const targetUser = getUser(targetNum)
    if (!targetUser) {
      return sock.sendMessage(from, { text: '🌸 Esa persona no se ha registrado en mi sistema todavía. 👀' }, { quoted: msg })
    }

    if (getAge(targetNum) < 15) {
      return sock.sendMessage(from, { text: '🌸 No te metas en problemas, esa persona es menor de 15 años. 🤫' }, { quoted: msg })
    }

    const targetRel = getRelation(targetNum)
    if (targetRel?.estado && targetRel.estado !== 'soltero') {
      return sock.sendMessage(from, { text: '🌸 Llegas tarde, esa persona ya está en una relación con alguien más. 💔' }, { quoted: msg })
    }

    if (sesiones.has(targetNum)) {
      return sock.sendMessage(from, { text: '🌸 Espera tu turno, ya tiene otra propuesta en espera. 👀' }, { quoted: msg })
    }

    createProposal(selfNum, targetNum, 'novio')
    sesiones.set(targetNum, { from: selfNum })

    const selfTag = selfJid.split('@')[0]
    const targetJid = `${targetNum}@s.whatsapp.net`

    // Unificado en un solo mensaje corto para evitar mandar alertas dobles molestas
    await sock.sendMessage(from, {
      text: `💌 @${targetNum}, ¡@${selfTag} te está pidiendo que sean novios! 😳 ¿Qué le vas a decir?\n\n*1.* Aceptar 💖\n*2.* Rechazar 💔\n\n_Responde con el número o "cancelar"._`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}