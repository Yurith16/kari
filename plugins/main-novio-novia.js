// plugins/novio.js
import { createProposal, getUser, getRelation, getAge, deleteProposal, setRelation, setNoviazgoFecha } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const sesiones = new Map()

export default {
  command: ['novio', 'novia'],
  tag: 'novio',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Pide a alguien que sea tu novio o novia',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (respuesta !== '1' && respuesta !== '2' && respuesta.toLowerCase() !== 'cancelar') return

    if (respuesta.toLowerCase() === 'cancelar') {
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)
      return sock.sendMessage(from, { text: '💔 Cancelaron la propuesta... y yo que ya tenía el discurso listo.' }, { quoted: msg })
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
        text: `💖 ¡Aceptó! @${sesion.from} y @${userNum} ahora son novios. Que dure para siempre. 🥹✨`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
    }

    if (respuesta === '2') {
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)

      return sock.sendMessage(from, {
        text: `💔 @${userNum} rechazó a @${sesion.from}. Hasta a Midori le dolió el corazón. 🥺`,
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
      return sock.sendMessage(from, { text: '> 🩷 Eres muy pequeño para el amor, necesitas al menos 15 años.' }, { quoted: msg })
    }

    const selfRel = getRelation(selfNum)
    if (selfRel?.estado && selfRel.estado !== 'soltero') {
      return sock.sendMessage(from, { text: '> 🩷 Ya tienes a alguien, no juegues con fuego.' }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, { text: '> 🩷 Menciona o responde al mensaje de quien te gusta.' }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: '> 🩷 ¿Pedirte noviazgo a ti mismo? Aquí estoy yo para ti.' }, { quoted: msg })
    }

    const targetUser = getUser(targetNum)
    if (!targetUser) {
      return sock.sendMessage(from, { text: '> 🩷 Esa persona no está registrada en el jardín.' }, { quoted: msg })
    }

    if (getAge(targetNum) < 15) {
      return sock.sendMessage(from, { text: '> 🩷 Esa persona es menor de 15 años, ni lo intentes.' }, { quoted: msg })
    }

    const targetRel = getRelation(targetNum)
    if (targetRel?.estado && targetRel.estado !== 'soltero') {
      return sock.sendMessage(from, { text: '> 🩷 Llegaste tarde, ya está en una relación.' }, { quoted: msg })
    }

    if (sesiones.has(targetNum)) {
      return sock.sendMessage(from, { text: '> 🩷 Ya tiene una propuesta pendiente, espera tu turno.' }, { quoted: msg })
    }

    createProposal(selfNum, targetNum, 'novio')
    sesiones.set(targetNum, { from: selfNum })

    const selfTag = selfJid.split('@')[0]
    const targetJid = `${targetNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      text: `🙈 Awww, @${selfTag} le pidió a @${targetNum} que sean novios. 🙊\n\n@${targetNum} solo debes escribir *1* si aceptas o *2* si lo rechazas 🥹`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}