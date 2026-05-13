// plugins/robar.js

import { getEconomy, addKryons, removeKryons, isRegistered, getUser, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 20 * 60 // 20 minutos

export default {
  command:     ['robar', 'steal'],
  tag:         'robar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Intenta robar kryons a otro usuario',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'robar', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌸 Ya intentaste robar hace poco. Espera *${formatCooldown(cd.secsLeft)}* para volver a intentarlo.`
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, {
        text: '🌸 ¿A quién le quieres robar? Menciona a la persona o responde a su mensaje.'
      }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: '🌸 No puedes robarte a ti mismo, corazón.' }, { quoted: msg })
    }

    if (!isRegistered(targetNum)) {
      return sock.sendMessage(from, { text: '🌸 Esa persona no está registrada en el bot.' }, { quoted: msg })
    }

    const ecoVictima = getEconomy(targetNum)

    if (ecoVictima.kryons < 50) {
      return sock.sendMessage(from, {
        text: '🌸 Esa persona no tiene suficientes kryons en la mano. No vale la pena robarla.'
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'robar')

    const exito = Math.random() < 0.4 // 40% de éxito
    const perfil = getUser(targetNum)
    const nombre = perfil.apodo || perfil.nombre

    if (exito) {
      const cantidad = Math.floor(Math.random() * (ecoVictima.kryons * 0.3)) + 20 // 20-30% de sus kryons
      removeKryons(targetNum, cantidad)
      addKryons(selfNum, cantidad)

      const targetJid = `${targetNum}@s.whatsapp.net`

      await sock.sendMessage(from, { react: { text: '🥷', key: msg.key } })

      await sock.sendMessage(from, {
        text: `🥷 ¡Qué hábil! Le robaste *${cantidad.toLocaleString()}* kryons a *${nombre}* sin que se diera cuenta.`,
        mentions: [selfJid, targetJid]
      }, { quoted: msg })
    } else {
      const multa = Math.floor(Math.random() * 100) + 50
      removeKryons(selfNum, multa)

      await sock.sendMessage(from, { react: { text: '🚔', key: msg.key } })

      await sock.sendMessage(from, {
        text: `🚔 Te atraparon robando a *${nombre}* y te multaron con *${multa.toLocaleString()}* kryons. ¡Qué mala suerte!`
      }, { quoted: msg })
    }
  }
}