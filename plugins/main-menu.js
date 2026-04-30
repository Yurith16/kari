import { toBold }  from '../utils/helpers.js'
import { commands } from '../core/plugins.js'

const startTime = Date.now()

function uptime() {
  const s = Math.floor((Date.now() - startTime) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// Tipo de letra Sans-Serif Bold Unicode (sin cursiva, limpia y legible)
function toSans(text) {
  const map = {
    A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
    N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
    a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
    n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
    0:'𝟬',1:'𝟭',2:'𝟮',3:'𝟯',4:'𝟰',5:'𝟱',6:'𝟲',7:'𝟳',8:'𝟴',9:'𝟵',' ':' '
  }
  return text.split('').map(c => map[c] || c).join('')
}

const CATEGORIAS = {
  main:      { label: '✦ PRINCIPALES',    icon: '🌿' },
  admin:     { label: '✦ ADMINISTRACION', icon: '👮' },
  owner:     { label: '✦ OWNER',          icon: '💎' },
  utilidad:  { label: '✦ UTILIDAD',       icon: '🔧' },
  descargas: { label: '✦ DESCARGAS',      icon: '📥' },
  diversion: { label: '✦ DIVERSION',      icon: '🎮' },
  busqueda:  { label: '✦ BUSQUEDA',       icon: '🔍' },
  nsfw:      { label: '✦ NSFW',           icon: '🔞' },
}

export default {
  command:   'menu',
  tag:       'menu',
  categoria: 'main',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isGroup, groupCfg, prefix }) {
    try {
      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

      const bot = global.bot || {}
      const div = `│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`

      // Filtrar y agrupar
      const seen = new Set()
      const mapa = {}
      for (const p of commands.values()) {
        if (!p.command || !p.categoria)                  continue
        if (p.owner && !isOwner)                         continue
        if (p.group && !isGroup)                         continue
        if (p.nsfw && (!groupCfg?.nsfw || !isGroup))     continue
        const name = p.tag || (Array.isArray(p.command) ? p.command[0] : p.command)
        if (seen.has(name)) continue
        seen.add(name)
        const cat = p.categoria || 'main'
        if (!mapa[cat]) mapa[cat] = []
        mapa[cat].push(name)
      }

      let txt = `╭─〔 🌸 ${toSans(bot.name?.toUpperCase() || 'BOT')} 🌸 〕\n`
      txt += `│\n`
      txt += `│ 🌿 ${toBold('Bot')}  ·  +${bot.botNumber || ''}\n`
      txt += `│ 👤 ${toBold('Dev')}  ·  ${bot.owner || ''}\n`
      txt += `│ 📞 ${toBold('Contacto')}  ·  +${bot.ownerNumber || ''}\n`
      txt += `│ 💬 ${toBold('Prefijo')}  ·  ${prefix}\n`
      txt += `│ ⏱ ${toBold('Activo')}  ·  ${uptime()}\n`
      txt += `${div}\n`

      for (const [key, info] of Object.entries(CATEGORIAS)) {
        const cmds = mapa[key]
        if (!cmds?.length) continue
        txt += `│\n`
        txt += `│ ${info.icon} ${toSans(info.label)}\n`
        for (const cmd of cmds) {
          txt += `│   ✦ ${prefix}${cmd}\n`
        }
      }

      txt += `│\n`
      txt += `╰─── ${toSans(bot.name || 'Bot')} ™ 🌸`

      await sock.sendMessage(from, {
        image:   { url: bot.defaultImg },
        caption: txt
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}