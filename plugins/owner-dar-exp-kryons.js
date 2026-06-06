// plugins/dar.js
import { addKryons, addXp, isRegistered } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'

export default {
  command:     'dar',
  tag:         'dar',
  categoria:   'owner',
  owner:       true,
  group:       false,
  nsfw:        false,
  descripcion: 'Añade kryons o experiencia a un usuario',

  async execute(sock, msg, { from }) {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/ +/).slice(1)

    if (args.length === 0) {
      let menu = `🌸 Elige qué recurso deseas otorgar:\n\n`
      menu += `_Uso: .dar [kryons/exp] [cantidad] [@user/responder]_\n`
      menu += `_Ejemplo: .dar kryons 500 @user_`
      return sock.sendMessage(from, { text: menu }, { quoted: msg })
    }

    const tipo = args[0]?.toLowerCase()
    if (tipo !== 'kryons' && tipo !== 'exp' && tipo !== 'experiencia') {
      return sock.sendMessage(from, { text: '🌸 Especifica si es *kryons* o *exp*.' }, { quoted: msg })
    }

    const cantidad = parseInt(args[1])
    if (isNaN(cantidad) || cantidad <= 0) {
      return sock.sendMessage(from, { text: '🌸 Ingresa una cantidad válida.' }, { quoted: msg })
    }

    const targetArgs = args.slice(2)
    const target = await resolveTarget(sock, msg, targetArgs).catch(() => null)

    if (!target?.num) {
      return sock.sendMessage(from, { text: '🌸 Etiqueta o responde a alguien.' }, { quoted: msg })
    }

    const targetNum = target.num
    const targetJid = `${targetNum}@s.whatsapp.net`

    if (!isRegistered(targetNum)) {
      return sock.sendMessage(from, { text: '🌸 El usuario no está registrado.' }, { quoted: msg })
    }

    let recursoTexto = ''
    if (tipo === 'kryons') {
      addKryons(targetNum, cantidad)
      recursoTexto = `*${cantidad.toLocaleString()}* kryons`
    } else {
      addXp(targetNum, cantidad)
      recursoTexto = `*${cantidad.toLocaleString()}* de EXP`
    }

    let txt = `🌸 Se añadieron ${recursoTexto} a la cuenta de @${targetNum}.`

    await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })
    await sock.sendMessage(from, { text: txt, mentions: [targetJid] }, { quoted: msg })
  }
}