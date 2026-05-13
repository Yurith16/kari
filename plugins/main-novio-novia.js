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

    // Solo procesar si es una respuesta válida a la propuesta
    if (respuesta !== '1' && respuesta !== '2' && respuesta.toLowerCase() !== 'cancelar') {
      return // Ignorar cualquier otro mensaje
    }

    if (respuesta.toLowerCase() === 'cancelar') {
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌸 Propuesta cancelada.' }, { quoted: msg })
      return
    }

    if (respuesta === '1') {
      const now = Math.floor(Date.now() / 1000)
      
      setRelation(userNum, 'en_relacion', sesion.from)
      setRelation(sesion.from, 'en_relacion', userNum)
      setNoviazgoFecha(userNum, now)
      setNoviazgoFecha(sesion.from, now)
      
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)

      const fromJid = `${sesion.from}@s.whatsapp.net`
      const toJid = `${userNum}@s.whatsapp.net`

      await sock.sendMessage(from, {
        text: `💖 *¡Aceptaste!*\n\n@${sesion.from} y @${userNum} ahora son novios.\n🌸 Que su historia de amor sea eterna.`,
        mentions: [fromJid, toJid]
      }, { quoted: msg })
      return
    }

    if (respuesta === '2') {
      deleteProposal(sesion.from, userNum, 'novio')
      sesiones.delete(userNum)

      await sock.sendMessage(from, {
        text: `💔 @${userNum} rechazó la propuesta de @${sesion.from}... será para otra ocasión.`,
        mentions: [`${sesion.from}@s.whatsapp.net`, `${userNum}@s.whatsapp.net`]
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
      return sock.sendMessage(from, { text: '🌸 Necesitas tener al menos 15 años para usar este comando.' }, { quoted: msg })
    }

    const selfRel = getRelation(selfNum)
    if (selfRel?.estado && selfRel.estado !== 'soltero') {
      return sock.sendMessage(from, { text: '🌸 Ya estás en una relación, no puedes pedirle a alguien más.' }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, { text: global.messages.userNeeded }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: '🌸 No puedes pedirte a ti mismo, corazón.' }, { quoted: msg })
    }

    const targetUser = getUser(targetNum)
    if (!targetUser) {
      return sock.sendMessage(from, { text: '🌸 Esa persona no está registrada, no la reconozco.' }, { quoted: msg })
    }

    if (getAge(targetNum) < 15) {
      return sock.sendMessage(from, { text: '🌸 Esa persona necesita tener al menos 15 años.' }, { quoted: msg })
    }

    const targetRel = getRelation(targetNum)
    if (targetRel?.estado && targetRel.estado !== 'soltero') {
      return sock.sendMessage(from, { text: '🌸 Esa persona ya está en una relación.' }, { quoted: msg })
    }

    if (sesiones.has(targetNum)) {
      return sock.sendMessage(from, { text: '🌸 Esa persona ya tiene una propuesta pendiente, espera a que responda.' }, { quoted: msg })
    }

    createProposal(selfNum, targetNum, 'novio')
    sesiones.set(targetNum, { from: selfNum })

    const targetJid = `${targetNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      text: `💌 *Propuesta enviada*\n\n@${selfNum} le pidió ser su novio/a a @${targetNum}... ¡qué emoción! Esperemos su respuesta.`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })

    await sock.sendMessage(from, {
      text: `💌 *¡Te pidieron ser novios!*\n\n@${selfNum} quiere ser tu novio/a. ¿Qué dices?\n\n*1.* Aceptar\n*2.* Rechazar\n\n_Escribe el número para responder o \"cancelar\"._`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}