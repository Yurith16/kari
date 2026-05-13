// plugins/setprefix.js

import { setGroupField, getGroup } from '../core/sqlite.js'

export default {
  command:     'setprefix',
  tag:         'setprefix',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Cambia el prefijo del bot en este grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      return sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
    }

    if (!args.length) {
      const cfg = getGroup(from)
      const actual = cfg.prefix || global.bot?.prefix?.[0] || '!'
      return sock.sendMessage(from, {
        text: `🌸 El prefijo actual es *${actual}*. Cámbialo con *.setprefix <nuevo>* o vuelve al global con *.setprefix reset*.`
      }, { quoted: msg })
    }

    const nuevo = args[0].toLowerCase()

    if (nuevo === 'reset') {
      setGroupField(from, 'prefix', '')
      return sock.sendMessage(from, {
        text: `🌸 Listo, ahora uso el prefijo global: *${global.bot?.prefix?.[0] || '!'}*.`
      }, { quoted: msg })
    }

    if (nuevo.length > 3) {
      return sock.sendMessage(from, {
        text: '🌸 Usa máximo 3 caracteres, corazón.'
      }, { quoted: msg })
    }

    setGroupField(from, 'prefix', nuevo)

    await sock.sendMessage(from, {
      text: `🌸 Ahora llámame con *${nuevo}*, así: *${nuevo}menu*.`
    }, { quoted: msg })
  }
}