// plugins/robar.js

import { getEconomy, addKryons, removeKryons, isRegistered, getUser, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'
import { formatCooldown } from '../utils/helpers.js'
import { toBold } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 10 minutos

export default {
  command: ['robar', 'steal', 'asaltar', 'ratero'],
  tag: 'robar',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
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
        text: `🌿 Las sombras te rechazan por ahora. Espera *${formatCooldown(cd.secsLeft)}* para tu próximo intento.`
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, {
        text: `🌿 ¿A quién planeas despojar, fiera? Menciona a la persona o responde a su mensaje.`
      }, { quoted: msg })
    }

    const targetNum = target.num
    const targetJid = `${targetNum}@s.whatsapp.net`

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: `🌿 No puedes robarte a ti mismo, eso no tiene sentido.` }, { quoted: msg })
    }

    if (!isRegistered(targetNum)) {
      return sock.sendMessage(from, { text: `🌿 Esa persona no existe en nuestros registros.` }, { quoted: msg })
    }

    const ecoVictima = getEconomy(targetNum)
    if (ecoVictima.kryons < 50) {
      return sock.sendMessage(from, { text: `🌿 ${target.name || 'Esa persona'} no tiene suficientes kryons para que valga la pena el riesgo.` }, { quoted: msg })
    }

    setCooldown(selfNum, 'robar')

    // Modificado a 65% de probabilidad de éxito
    const exito = Math.random() < 0.65
    const perfil = getUser(targetNum)
    const nombre = perfil.apodo || perfil.nombre

    if (exito) {
      const cantidad = Math.floor(Math.random() * (ecoVictima.kryons * 0.3)) + 20
      removeKryons(targetNum, cantidad)
      addKryons(selfNum, cantidad)

      const reacciones = ['🥷', '🐍', '🌑', '💸', '🕶️']
      const react = reacciones[Math.floor(Math.random() * reacciones.length)]

      const frasesExito = [
        `🥷 Qué manos tan rápidas. Le robaste *${cantidad.toLocaleString()}* kryons a *${nombre}* sin dejar rastro.`,
        `🐍 Te escabulliste como una sombra y le arrebataste *${cantidad.toLocaleString()}* kryons a *${nombre}*.`,
        `🌑 En la penumbra, lograste sacar *${cantidad.toLocaleString()}* kryons del bolsillo de *${nombre}*.`,
        `💸 *${nombre}* ni siquiera se dio cuenta de que le faltaban *${cantidad.toLocaleString()}* kryons.`,
        `🕶️ Actuaste con total sigilo y te llevaste *${cantidad.toLocaleString()}* kryons de *${nombre}*.`,
        `🍃 Como una hoja cayendo, tomaste *${cantidad.toLocaleString()}* kryons de *${nombre}* sin hacer ruido.`,
        `🧪 Usaste un poco de polvo de Midori para despistar a *${nombre}* y robarle *${cantidad.toLocaleString()}* kryons.`,
        `🎭 Tu disfraz fue perfecto, *${nombre}* entregó *${cantidad.toLocaleString()}* kryons pensando que era una donación.`,
        `💌 Interceptaste la correspondencia de *${nombre}* y encontraste *${cantidad.toLocaleString()}* kryons.`,
        `🦇 Apareciste de la nada y te fuiste con *${cantidad.toLocaleString()}* kryons de *${nombre}*.`,
        `🎒 Mientras *${nombre}* estaba distraído, vaciaste parte de su mochila obteniendo *${cantidad.toLocaleString()}* kryons.`,
        `💎 Engañaste a *${nombre}* con una piedra falsa y cambiaste su fortuna por *${cantidad.toLocaleString()}* kryons.`,
        `🗝️ Abriste su cerradura secreta y te hiciste con *${cantidad.toLocaleString()}* kryons de *${nombre}*.`,
        `🔥 El caos fue tu mejor aliado, aprovechaste el desorden para quitarle *${cantidad.toLocaleString()}* kryons a *${nombre}*.`,
        `💍 Convenciste a *${nombre}* de empeñar sus joyas, pero te quedaste con *${cantidad.toLocaleString()}* kryons del trato.`,
        `🧬 Clonaste su tarjeta en un descuido y transferiste *${cantidad.toLocaleString()}* kryons a tu cuenta.`,
        `🏍️ Le hiciste un placaje en seco y le quitaste *${cantidad.toLocaleString()}* kryons a *${nombre}*.`,
        `🥀 *${nombre}* suspiraba por un amor perdido y, en su descuido, le robaste *${cantidad.toLocaleString()}* kryons.`,
        `👑 Te hiciste pasar por un oficial y le cobraste una multa falsa de *${cantidad.toLocaleString()}* kryons a *${nombre}*.`,
        `🛸 Fuiste tan veloz que *${nombre}* todavía cree que sus *${cantidad.toLocaleString()}* kryons se evaporaron.`
      ]

      await sock.sendMessage(from, { react: { text: react, key: msg.key } })
      await sock.sendMessage(from, { text: `> ${frasesExito[Math.floor(Math.random() * frasesExito.length)]}`, mentions: [targetJid] }, { quoted: msg })
    } else {
      const multa = Math.floor(Math.random() * 100) + 50
      removeKryons(selfNum, multa)

      const reacciones = ['🚔', '🚨', '🥀', '⛓️', '💔']
      const react = reacciones[Math.floor(Math.random() * reacciones.length)]

      const frasesFracaso = [
        `🚔 Mala suerte, te atraparon robándole a *${nombre}*. Multa: *${multa.toLocaleString()}* kryons.`,
        `🚨 La sirena sonó y *${nombre}* te descubrió con las manos en la masa. Perdiste *${multa.toLocaleString()}* kryons.`,
        `🥀 Tu intento de robar a *${nombre}* falló estrepitosamente. Gastaste *${multa.toLocaleString()}* kryons en sobornos.`,
        `⛓️ Terminaste esposado intentando asaltar a *${nombre}*. La fianza te costó *${multa.toLocaleString()}* kryons.`,
        `💔 *${nombre}* te pilló y te rompió el corazón (y la billetera). Perdiste *${multa.toLocaleString()}* kryons.`,
        `🧤 Se te resbaló el botín y terminaste pagando una compensación de *${multa.toLocaleString()}* kryons a *${nombre}*.`,
        `📉 El plan salió mal, *${nombre}* llamó a seguridad y perdiste *${multa.toLocaleString()}* kryons.`,
        `🐕 Los perros guardianes de *${nombre}* te acorralaron. Perdiste *${multa.toLocaleString()}* kryons al huir.`,
        `🌩️ Intentaste robar bajo la lluvia pero te resbalaste y perdiste *${multa.toLocaleString()}* kryons.`,
        `🛡️ *${nombre}* tenía un guardaespaldas invisible. Te costó *${multa.toLocaleString()}* kryons escapar del susto.`,
        `🏮 La luz se encendió justo cuando tocabas su bolsillo. Perdiste *${multa.toLocaleString()}* kryons tratando de salir.`,
        `🧤 Te olvidaste de los guantes y dejaste huellas. *${multa.toLocaleString()}* kryons menos por limpiar el rastro.`,
        `🎥 Una cámara de seguridad te capturó robando a *${nombre}*. Multa: *${multa.toLocaleString()}* kryons.`,
        `🩹 En el forcejeo con *${nombre}* te lesionaste y perdiste *${multa.toLocaleString()}* kryons en curación.`,
        `🕸️ Te quedaste enredado en sus trampas. Perdiste *${multa.toLocaleString()}* kryons tratando de librarte.`,
        `🔥 El explosivo falló y quemaste tus reservas: *${multa.toLocaleString()}* kryons lost.`,
        `🚁 Intentaste escapar por aire pero te interceptaron. Perdiste *${multa.toLocaleString()}* kryons por el atraco fallido.`,
        `🎭 Tu máscara se cayó frente a *${nombre}*. Perdiste *${multa.toLocaleString()}* kryons en silencio.`,
        `😭 *${nombre}* lloró tanto que te dio lástima y le pagaste *${multa.toLocaleString()}* kryons por el mal trago.`,
        `🦇 Un murciélago te asustó mientras robabas a *${nombre}*, tiraste tu bolsa con *${multa.toLocaleString()}* kryons.`
      ]

      await sock.sendMessage(from, { react: { text: react, key: msg.key } })
      await sock.sendMessage(from, { text: `> ${frasesFracaso[Math.floor(Math.random() * frasesFracaso.length)]}`, mentions: [targetJid] }, { quoted: msg })
    }
  }
}