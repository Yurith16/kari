import { unignoreUser, isIgnored, getIgnored } from '../core/sqlite.js'
import { resolveTarget }                        from '../utils/target.js'

const designorar = {
  command:     ['designorar', 'unignore'],
  tag:         'unignore',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Deja de ignorar a un usuario en este grupo',

  async execute(sock, msg, { from, args, isAdmin, isOwner }) {
    await sock.sendMessage(from, { react: { text: '👂', key: msg.key } })

    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, { text: global.messages?.userNeeded }, { quoted: msg })
      return
    }

    if (!isIgnored(from, target.num)) {
      await sock.sendMessage(from, {
        text: '_Ese usuario no estaba ignorado en este grupo._'
      }, { quoted: msg })
      return
    }

    unignoreUser(from, target.num)

    await sock.sendMessage(from, {
      text: `_@${target.num} ya puede usar comandos nuevamente._`,
      mentions: [`${target.num}@s.whatsapp.net`]
    }, { quoted: msg })
  }
}

const ignorados = {
  command:     'ignorados',
  tag:         'ignorados',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Lista de usuarios ignorados en este grupo',

  async execute(sock, msg, { from, isAdmin, isOwner }) {
    await sock.sendMessage(from, { react: { text: '📋', key: msg.key } })

    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const lista = getIgnored(from)

    if (lista.length === 0) {
      await sock.sendMessage(from, {
        text: '_No hay usuarios ignorados en este grupo._'
      }, { quoted: msg })
      return
    }

    let txt = `𝚄𝚂𝚄𝙰𝚁𝙸𝙾𝚂 𝙸𝙶𝙽𝙾𝚁𝙰𝙳𝙾𝚂\n`
    txt += `⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱\n\n`

    lista.forEach((u) => {
      txt += `> ✦ *Usuario* +${u}\n\n`
    })

    txt += `> ✦ *Total:* ${lista.length} usuario(s)`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}

export default [designorar, ignorados]