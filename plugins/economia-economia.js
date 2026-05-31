// plugins/economia.js

import { setGroupField } from '../core/sqlite.js'
import { toBold }        from '../utils/helpers.js'

export default {
  command:     ['economia', 'eco'],
  tag:         'economia',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Activa o desactiva los comandos de economía en el grupo',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      return sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
    }

    const estadoActual = groupCfg?.economia === 0 ? false : true
    const nuevoEstado = !estadoActual
    
    setGroupField(from, 'economia', nuevoEstado ? 1 : 0)

    // Reacción aleatoria según el nuevo estado
    const react = nuevoEstado ? '🟢' : '🔴'
    await sock.sendMessage(from, { react: { text: react, key: msg.key } })

    const respuesta = nuevoEstado 
      ? `> 🌿 *Sistema activado*\n\nLos comandos de economía ahora están disponibles. Ya pueden usar *work*, *minar*, *crimen* y más.`
      : `> 🍂 *Sistema desactivado*\n\nLos comandos de economía han sido restringidos en este grupo por el momento.`

    await sock.sendMessage(from, { text: respuesta }, { quoted: msg })
  }
}