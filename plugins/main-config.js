import { getGroup } from '../core/sqlite.js'

export default {
  command: 'config',
  owner:   false,
  group:   false,

  async execute(sock, msg, { from, isOwner, isAdmin, isGroup }) {
    const f    = global.features || {}
    const icon = (val) => val ? '🟢 on' : '⚪ off'

    // Features globales
    const global_list = [
      `├ antiCall:     ${icon(f.antiCall)}`,
      `├ autoRead:     ${icon(f.autoRead)}`,
      `├ autoBio:      ${icon(f.autoBio)}`,
      `├ antiSpam:     ${icon(f.antiSpam)}`,
      `├ allowPrivate: ${icon(f.allowPrivate)}`,
      `└ maintenance:  ${icon(f.maintenance)}`,
    ].join('\n')

    let group_list = '  Solo disponible en grupos.'
    if (isGroup) {
      const cfg = getGroup(from)
      group_list = [
        `├ antiLink:   ${icon(cfg.antiLink)}`,
        `├ welcomeMsg: ${icon(cfg.welcomeMsg)}`,
        `├ goodbyeMsg: ${icon(cfg.goodbyeMsg)}`,
        `├ nsfw:       ${icon(cfg.nsfw)}`,
        `└ adminMode:  ${icon(cfg.adminMode)}`,
      ].join('\n')
    }

    await sock.sendMessage(from, {
      text: `⚙️ *Configuración actual*\n\n🔒 *Globales (owner):*\n${global_list}\n\n👮 *Este grupo (admin):*\n${group_list}\n\n📌 Cambia con *.enable* o *.disable*`
    }, { quoted: msg })
  }
}