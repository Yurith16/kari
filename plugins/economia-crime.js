// plugins/crimen.js

import { getEconomy, addKryons, removeKryons, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 25 * 60 // 25 minutos

export default {
  command:     ['crimen', 'crime'],
  tag:         'crimen',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Comete un crimen arriesgado por kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'crimen', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌸 Ya hiciste de las tuyas hace poco. Espera *${formatCooldown(cd.secsLeft)}* para volver a intentarlo.`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'crimen')

    const exito = Math.random() < 0.45 // 45% de éxito

    if (exito) {
      const ganancia = Math.floor(Math.random() * 400) + 150 // 150-550 kryons
      addKryons(selfNum, ganancia)

      const frases = [
        `💀 Hackeaste un cajero y sacaste *${ganancia.toLocaleString()}* kryons. Nadie te vio.`,
        `🕶 Te hiciste pasar por alguien más y estafaste *${ganancia.toLocaleString()}* kryons.`,
        `🔫 Asaltaste un banco y huiste con *${ganancia.toLocaleString()}* kryons. La adrenalina.`,
        `🌙 Vendiste información secreta y te pagaron *${ganancia.toLocaleString()}* kryons.`
      ]

      await sock.sendMessage(from, { react: { text: '💰', key: msg.key } })
      await sock.sendMessage(from, { text: frases[Math.floor(Math.random() * frases.length)] }, { quoted: msg })
    } else {
      const perdida = Math.floor(Math.random() * 200) + 80 // 80-280 kryons
      removeKryons(selfNum, perdida)

      const frases = [
        `🚨 La policía te atrapó y perdiste *${perdida.toLocaleString()}* kryons en sobornos.`,
        `🔒 Fallaste el golpe y te quitaron *${perdida.toLocaleString()}* kryons.`,
        `💔 Tu cómplice te traicionó y perdiste *${perdida.toLocaleString()}* kryons.`,
        `🏥 Saliste herido del atraco y gastaste *${perdida.toLocaleString()}* kryons en curarte.`
      ]

      await sock.sendMessage(from, { react: { text: '🚨', key: msg.key } })
      await sock.sendMessage(from, { text: frases[Math.floor(Math.random() * frases.length)] }, { quoted: msg })
    }
  }
}