import os from 'os'

const startTime = Date.now()

export default {
  command:   'estado',
  tag:       'estado',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const s   = Math.floor((Date.now() - startTime) / 1000)
    const h   = Math.floor(s / 3600)
    const m   = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const uptime = `${h}h ${m}m ${sec}s`
    const ram    = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(0)}MB`
    const bot    = global.bot || {}
    const f      = global.features || {}

    const txt = [
      `🌿 *${bot.name}* v${bot.version}`,
      ``,
      `⏱ Uptime: *${uptime}*`,
      `🧠 RAM: *${ram}*`,
      `📦 Node: *${process.version}*`,
      `💬 Prefijo: *${bot.prefix?.join(' ')}*`,
      ``,
      `🔧 Mantenimiento: *${f.maintenance ? 'activado' : 'desactivado'}*`,
      `📵 Anti-call: *${f.antiCall ? 'on' : 'off'}*`,
      `🛡 Anti-spam: *${f.antiSpam ? 'on' : 'off'}*`,
    ].join('\n')

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}