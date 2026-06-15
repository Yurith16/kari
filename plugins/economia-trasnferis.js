// plugins/eco-transferir.js
import { getEconomy, addKryons, removeKryons, withdrawBanco, isRegistered, getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const frases = [
  { texto: 'Le transferiste', cierre: 'Que lindo gesto de tu parte.' },
  { texto: 'Le enviaste', cierre: 'Así se comparte la abundancia.' },
  { texto: 'Le diste', cierre: 'Tu generosidad florece.' },
  { texto: 'Le regalaste', cierre: 'Un detalle que vale más que el oro.' },
  { texto: 'Le compartiste', cierre: 'Eso habla bien de vos.' },
  { texto: 'Le dejaste', cierre: 'Sin esperar nada a cambio.' },
  { texto: 'Le pasaste', cierre: 'La amistad también se riega.' },
  { texto: 'Le entregaste', cierre: 'Hecho con el corazón.' },
  { texto: 'Le sembraste', cierre: 'Tu jardín crece compartiendo.' },
  { texto: 'Le donaste', cierre: 'Midori aplaude tu gesto.' },
  { texto: 'Le alcanzaste', cierre: 'Un empujoncito que ayuda mucho.' },
  { texto: 'Le soltaste', cierre: 'Dar también es soltar.' },
  { texto: 'Le ofreciste', cierre: 'Así se cultivan las buenas relaciones.' },
  { texto: 'Le cediste', cierre: 'Pequeño gesto, gran diferencia.' },
  { texto: 'Le acercaste', cierre: 'Porque compartir es de almas bonitas.' },
]

export default {
  command: ['transferir', 'pay', 'pagar', 'enviar'],
  tag: 'transferir',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Transfiere kryons a otro usuario',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: '🌸 ¿A quién y cuánto? Ejemplo: .pay @usuario 500'
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, {
        text: '🌸 Menciona a la persona o responde a su mensaje.'
      }, { quoted: msg })
    }

    const targetNum = target.num
    const targetJid = `${targetNum}@s.whatsapp.net`

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: '🌸 No puedes transferirte a ti mismo.' }, { quoted: msg })
    }

    if (!isRegistered(targetNum)) {
      return sock.sendMessage(from, { text: '🌸 Esa persona no está registrada.' }, { quoted: msg })
    }

    const cantidad = parseInt(args[args.length - 1])
    if (isNaN(cantidad) || cantidad <= 0) {
      return sock.sendMessage(from, { text: '🌸 Indica una cantidad válida.' }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)
    const total = eco.kryons + eco.banco

    if (cantidad > total) {
      return sock.sendMessage(from, {
        text: `🌸 Lo siento, no se puede hacer la transferencia. Solo tienes *${total.toLocaleString()} kryons* en total.`
      }, { quoted: msg })
    }

    // Primero quitar de mano lo que se pueda
    const deMano = Math.min(eco.kryons, cantidad)
    const delBanco = cantidad - deMano

    if (deMano > 0) removeKryons(selfNum, deMano)
    if (delBanco > 0) withdrawBanco(selfNum, delBanco)
    if (delBanco > 0) removeKryons(selfNum, delBanco)

    addKryons(targetNum, cantidad)

    const perfil = getUser(targetNum)
    const nombre = perfil?.nombre || targetNum
    const frase = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

    const txt = `🌸 ${frase.texto} ${cantidad.toLocaleString()} kryons a ${nombre}. ${frase.cierre}`

    await sock.sendMessage(from, {
      text: txt,
      mentions: [targetJid]
    }, { quoted: msg })
  }
}