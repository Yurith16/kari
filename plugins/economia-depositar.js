// plugins/depositar.js

import { getEconomy, depositBanco, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

export default {
  command: ['depositar', 'dep', 'deposit', 'deposita', 'guardar', 'banco'],
  tag: 'depositar', 
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Guarda tus kryons en el banco de Midori-Hana',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)
    const reacciones = ['🌿', '🌱', '🍀', '🍃', '💚', '🎋', '🌲']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    if (!args.length) {
      if (eco.kryons === 0) {
        return sock.sendMessage(from, {
          text: `🌿 No tienes kryons en mano para proteger.`
        }, { quoted: msg })
      }
      return sock.sendMessage(from, {
        text: `> ╭─〔 🏦 *BANCO CENTRAL* 〕\n` +
              `> │\n` +
              `> │ 🪙 *En mano:* ${eco.kryons.toLocaleString()}\n` +
              `> │ 🏦 *En banco:* ${eco.banco.toLocaleString()}\n` +
              `> │\n` +
              `> │ 🌿 *Uso:* .dep <cantidad> o .dep all\n` +
              `> ╰─── ${toBold(global.bot?.name || 'Bot')} 🌿`
      }, { quoted: msg })
    }

    let cantidad

    if (args[0].toLowerCase() === 'all') {
      cantidad = eco.kryons
    } else {
      cantidad = parseInt(args[0])
      if (isNaN(cantidad) || cantidad <= 0) {
        return sock.sendMessage(from, {
          text: `🌿 Indica una cantidad válida.`
        }, { quoted: msg })
      }
    }

    if (cantidad > eco.kryons) {
      return sock.sendMessage(from, {
        text: `🌿 No tienes tantos kryons sueltos. Solo posees *${eco.kryons.toLocaleString()}*.`
      }, { quoted: msg })
    }

    depositBanco(selfNum, cantidad)
    const ecoActual = getEconomy(selfNum)

    const mensajesExito = [
      `🏦 Has guardado *${cantidad.toLocaleString()}* kryons. El banco de Midori-Hana los mantendrá a salvo.`,
      `🌿 Depósito procesado. *${cantidad.toLocaleString()}* kryons ahora reposan en tu cuenta.`,
      `🔐 Transacción exitosa. Tu capital de *${cantidad.toLocaleString()}* kryons está bajo llave.`,
      `🍀 Has movido *${cantidad.toLocaleString()}* kryons a tu cuenta. La prudencia te hará rico.`,
      `💼 Fondos resguardados correctamente. Tu banco ahora tiene *${ecoActual.banco.toLocaleString()}* kryons.`,
      `🌱 Una inversión sabia. *${cantidad.toLocaleString()}* kryons han sido depositados con éxito.`,
      `🍃 Operación completada. Tu riqueza crece segura en el banco, ahora cuentas con *${ecoActual.banco.toLocaleString()}*.`,
      `💚 Has puesto *${cantidad.toLocaleString()}* kryons a buen recaudo. ¡Excelente decisión!`,
      `🎋 Tus *${cantidad.toLocaleString()}* kryons han sido registrados. El banco sigue creciendo contigo.`,
      `🌲 Has guardado *${cantidad.toLocaleString()}* kryons, lejos de cualquier ladrón.`,
      `🔮 Movimiento realizado. Tu tesoro de *${cantidad.toLocaleString()}* kryons está en manos seguras.`,
      `🧪 Has depositado *${cantidad.toLocaleString()}* kryons. Tu balance bancario es ahora de *${ecoActual.banco.toLocaleString()}*.`,
      `🥀 No te arriesgues a perderlo todo. *${cantidad.toLocaleString()}* kryons han sido guardados.`,
      `💌 Depósito recibido. Cuidaremos tus *${cantidad.toLocaleString()}* kryons como si fueran nuestros.`,
      `🥂 Brindamos por tu seguridad financiera. *${cantidad.toLocaleString()}* kryons añadidos al banco.`,
      `🧬 Tu capital se consolida. Has añadido *${cantidad.toLocaleString()}* kryons al sistema bancario.`,
      `🌙 En el sigilo de la noche, tus *${cantidad.toLocaleString()}* kryons han sido depositados exitosamente.`,
      `🏍️ Fondos transferidos a alta velocidad. *${cantidad.toLocaleString()}* kryons ya están en tu banco.`,
      `👑 Eres un estratega. *${cantidad.toLocaleString()}* kryons guardados bajo el sello de Midori-Hana.`,
      `🦋 Has asegurado *${cantidad.toLocaleString()}* kryons. El banco es el lugar más seguro para ellos.`
    ]

    const msgFinal = mensajesExito[Math.floor(Math.random() * mensajesExito.length)]

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { text: `> ${msgFinal}\n\n> ⚖️ *Total en banco:* ${ecoActual.banco.toLocaleString()}` }, { quoted: msg })
  }
}