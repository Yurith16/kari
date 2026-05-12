import { setGroupField } from '../core/sqlite.js'
import { toBold }        from '../utils/helpers.js'

export default {
  command:     'economia',
  tag:         'economia',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Activa o desactiva los comandos de economía en el grupo',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const estado = groupCfg?.economia === 0 ? false : true // default ON
    setGroupField(from, 'economia', estado ? 0 : 1)

    await sock.sendMessage(from, {
      text: estado
        ? '🍃 Los comandos de economía han sido *desactivados* en este grupo.'
        : '🌿 Los comandos de economía están *activados* en este grupo. Los usuarios ya pueden usar work, minar y más.'
    }, { quoted: msg })
  }
}