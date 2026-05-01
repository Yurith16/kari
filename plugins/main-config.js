import { getGroup } from '../core/sqlite.js'
import { toBold }   from '../utils/helpers.js'

export default {
  command:   'config',
  tag:       'config',
  categoria: 'main',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin, isGroup }) {
    const f    = global.features || {}
    const on   = (val) => val === true || val === 1 ? '🟢 on' : '⚪ off'
    const div  = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

    // Owner en privado o en grupo — muestra globales
    // Admin en grupo — muestra solo del grupo
    // Owner en grupo — muestra ambos

    let txt = `╭─〔 ${toBold('CONFIGURACION')} 〕\n│\n`

    if (isOwner) {
      txt += `│ ${toBold('Globales')}\n`
      txt += `│ ${div}\n`
      txt += `│ ✦ antiCall     ${on(f.antiCall)}\n`
      txt += `│ ✦ autoRead     ${on(f.autoRead)}\n`
      txt += `│ ✦ autoBio      ${on(f.autoBio)}\n`
      txt += `│ ✦ antiSpam     ${on(f.antiSpam)}\n`
      txt += `│ ✦ allowPrivate ${on(f.allowPrivate)}\n`
      txt += `│ ✦ maintenance  ${on(f.maintenance)}\n`
      txt += `│\n`
    }

    if (isGroup && (isOwner || isAdmin)) {
      const cfg = getGroup(from)
      txt += `│ ${toBold('Este grupo')}\n`
      txt += `│ ${div}\n`
      txt += `│ ✦ antiLink   ${on(cfg.antiLink)}\n`
      txt += `│ ✦ welcomeMsg ${on(cfg.welcomeMsg)}\n`
      txt += `│ ✦ goodbyeMsg ${on(cfg.goodbyeMsg)}\n`
      txt += `│ ✦ nsfw       ${on(cfg.nsfw)}\n`
      txt += `│ ✦ adminMode  ${on(cfg.adminMode)}\n`
      txt += `│\n`
    }

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}