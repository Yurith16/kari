import { getUser, getEconomy }      from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold }                  from '../utils/helpers.js'
import { resolveTarget }           from '../utils/target.js'

function nivelBarra(exp) {
  const expNivel = 500
  const progreso = exp % expNivel
  const llenos   = Math.floor((progreso / expNivel) * 10)
  return '▓'.repeat(llenos) + '░'.repeat(10 - llenos)
}

export default {
  command:     'perfil',
  tag:         'perfil',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra tu perfil o el de otro usuario',

  async execute(sock, msg, { from, args, sender }) {
    const target = args.length ? await resolveTarget(sock, msg, args) : null
    let user

    if (target?.num) {
      user = target.num
    } else {
      const realJid = await getRealJid(sock, sender, msg).catch(() => sender)
      user = cleanNumber(realJid)
    }

    if (!user) {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
      return
    }

    const perfil = getUser(user)
    if (!perfil) {
      const esSelf = !target?.num
      await sock.sendMessage(from, {
        text: esSelf
          ? global.messages.notRegistered
          : '🌸 Ese usuario aún no tiene un perfil creado.'
      }, { quoted: msg })
      return
    }

    const eco    = getEconomy(user)
    const nivel  = eco?.nivel || 1
    const exp    = eco?.xp || 0
    const barra  = nivelBarra(exp)
    const expNivel = 500
    const progreso = exp % expNivel

    const generoEmoji = perfil.genero === 'hombre' ? '👦' : perfil.genero === 'mujer' ? '👧' : '🌿'
    const div = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

    let txt = `╭─〔 🌸 *PERFIL* 〕\n`
    txt += `│\n`
    txt += `│ ✦ *Nombre:* ${perfil.nombre}\n`
    if (perfil.apodo) txt += `│ ✦ *Apodo:* ${perfil.apodo}\n`
    txt += `│ ✦ *Edad:* ${perfil.edad} años\n`
    txt += `│ ✦ *Género:* ${generoEmoji} ${perfil.genero}\n`
    txt += `│ ✦ *País:* ${perfil.pais}\n`
    txt += `│\n`
    txt += `│ ${div}\n`
    txt += `│\n`
    txt += `│ ✦ *Nivel:* ${nivel}\n`
    txt += `│ ✦ *Experiencia:* ${progreso}/${expNivel}\n`
    txt += `│   [${barra}]\n`
    txt += `│\n`
    txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    const mentions = target?.num ? [`${target.num}@s.whatsapp.net`] : []

    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
}