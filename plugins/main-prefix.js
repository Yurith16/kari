// plugins/setprefix.js
import { setGroupField, getGroup } from '../core/sqlite.js'

export default {
  command:     ['prefix', 'prefijo'],
  tag:         'prefix',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Cambia la forma en que llamas a Midori',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      return sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
    }

    const textMsg   = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedAlias = textMsg.trim().split(/\s+/)[0].slice(1).toLowerCase() || 'prefijo'

    const cfg = getGroup(from)
    const actual = cfg.prefix || global.bot?.prefix?.[0] || '!'

    if (!args.length) {
      const txtInfo = [
        `🌸 *¿Quieres cambiar cómo me llamas?*`,
        `Ahora mismo respondo a: *${actual}*`,
        ``,
        `• Modificar: ${actual}${usedAlias} <carácter>`,
        `• Restablecer: ${actual}${usedAlias} reset`
      ].join('\n')

      return sock.sendMessage(from, { text: txtInfo }, { quoted: msg })
    }

    const nuevo = args[0].toLowerCase()

    if (nuevo === 'reset') {
      setGroupField(from, 'prefix', '')
      const globalPref = global.bot?.prefix?.[0] || '!'

      const txtReset = [
        `🔄 *Volvemos a lo de siempre...*`,
        `Ya olvidé ese prefijo. Desde ahora búscame con el global: *${globalPref}* 🌸`
      ].join('\n')

      return sock.sendMessage(from, { text: txtReset }, { quoted: msg })
    }

    if (nuevo.length > 3) {
      return sock.sendMessage(from, {
        text: `⚠️ *No te pases, es muy largo.*\nPonme algo más cortito, de máximo 3 caracteres.`
      }, { quoted: msg })
    }

    setGroupField(from, 'prefix', nuevo)

    const txtSuccess = [
      `⚙️ *Configuración guardada...*`,
      `A partir de ahora solo te voy a hacer caso si usas: *${nuevo}*`,
      `A ver, inténtalo con *${nuevo}menu*... si quieres. 🤭`
    ].join('\n')

    await sock.sendMessage(from, { text: txtSuccess }, { quoted: msg })
  }
}