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
        text: '🌸 Ese usuario no estaba siendo ignorado en este grupo.'
      }, { quoted: msg })
      return
    }

    unignoreUser(from, target.num)

    await sock.sendMessage(from, {
      text: `✅ @${target.num} ya puede usar comandos en este grupo nuevamente.`,
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
    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const lista = getIgnored(from)

    if (lista.length === 0) {
      await sock.sendMessage(from, {
        text: '🌿 No hay usuarios ignorados en este grupo.'
      }, { quoted: msg })
      return
    }

    let txt = `> ╭─〔 🔇 *IGNORADOS* 〕\n`
    txt += `> │\n`
    lista.forEach((u, i) => {
      txt += `> │ ${i + 1}. +${u}\n`
    })
    txt += `> │\n`
    txt += `> ╰─── *${lista.length} usuario(s)* ✦`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}

export default [designorar, ignorados]