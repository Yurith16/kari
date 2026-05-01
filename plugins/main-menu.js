// plugins/menu.js

import { toBold, toMono } from '../utils/helpers.js'
import { commands }       from '../core/plugins.js'

const startTime = Date.now()

const CAT_EMOJI = {
  main:      '🌿',
  admin:     '👮',
  owner:     '💎',
  utilidad:  '🔧',
  descargas: '📥',
  diversion: '🎮',
  busqueda:  '🔍',
  nsfw:      '🔞',
}

const BULLETS = ['🌸', '🍃', '🌺', '✿', '🌼', '🍀', '🌻', '💮']
let bulletIdx  = 0
const getBullet = () => BULLETS[bulletIdx++ % BULLETS.length]

function uptime() {
  const ms  = Date.now() - startTime
  const h   = Math.floor(ms / 3600000)
  const m   = Math.floor(ms / 60000) % 60
  const s   = Math.floor(ms / 1000) % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function getGreeting() {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Tegucigalpa' })).getHours()
  if (h >= 5  && h < 12) return '🌅 Buenos días'
  if (h >= 12 && h < 18) return '☀️ Buenas tardes'
  if (h >= 18 && h < 22) return '🌙 Buenas noches'
  return '🌌 Buenas madrugada'
}

function getDate() {
  return new Date().toLocaleDateString('es-HN', {
    timeZone: 'America/Tegucigalpa',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function getTime() {
  return new Date().toLocaleTimeString('es-HN', {
    timeZone: 'America/Tegucigalpa',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

function buildCategoryBox(catName, cmds, prefix, bullet) {
  let txt = `╭─〔 ${toMono(catName.toUpperCase())} 〕\n`
  txt += `│\n`
  cmds.sort().forEach(cmd => {
    txt += `│ ${bullet} ${prefix}${cmd}\n`
  })
  txt += `│\n`
  txt += `╰─── ── ── ── ──\n`
  return txt
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
      const ping = Date.now()
      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })
      const latency = Date.now() - ping

      const bot    = global.bot || {}
      const bullet = getBullet()
      const botName = bot.name || 'Bot'

      const seen  = new Set()
      const mapa  = {}
      let   total = 0

      for (const p of commands.values()) {
        if (!p.command || !p.categoria)              continue
        if (p.owner && !isOwner)                     continue
        if (p.group && !isGroup)                     continue
        if (p.nsfw && (!groupCfg?.nsfw || !isGroup)) continue
        const name = p.tag || (Array.isArray(p.command) ? p.command[0] : p.command)
        if (seen.has(name)) continue
        seen.add(name)
        const cat = p.categoria || 'main'
        if (!mapa[cat]) mapa[cat] = []
        mapa[cat].push(name)
        total++
      }

      let grupos = 0
      try {
        const g = await sock.groupFetchAllParticipating()
        grupos  = Object.keys(g).length
      } catch {}

      const username = msg.pushName || 'amor'
      const greeting = getGreeting()
      const fecha    = getDate()
      const hora     = getTime()

      // Encabezado
      let menuTxt = `╭─〔 🌸 *${toMono(botName.toUpperCase())}* 🌸 〕\n`
      menuTxt += `│\n`
      menuTxt += `│ *${greeting}, ${username}* 🌿\n`
      menuTxt += `│ ${bullet} ${fecha}\n`
      menuTxt += `│ ${bullet} ${hora} · Honduras\n`
      menuTxt += `│\n`
      menuTxt += `╰─── ── ── ── ──\n\n`

      // Info del bot
      menuTxt += `╭─〔 ${toMono('INFO DEL BOT')} 〕\n`
      menuTxt += `│\n`
      menuTxt += `│ ✦ Bot       ·  +${bot.botNumber || ''}\n`
      menuTxt += `│ ✦ Dev       ·  ${bot.owner || ''}\n`
      menuTxt += `│ ✦ Contacto  ·  +${bot.ownerNumber || ''}\n`
      menuTxt += `│ ✦ Prefijo   ·  ${prefix}\n`
      menuTxt += `│ ✦ Activo    ·  ${uptime()}\n`
      menuTxt += `│ ✦ Grupos    ·  ${grupos}\n`
      menuTxt += `│ ✦ Latencia  ·  ${latency}ms\n`
      menuTxt += `│ ✦ Comandos  ·  ${total}\n`
      menuTxt += `│\n`
      menuTxt += `╰─── ── ── ── ──\n\n`

      // Categorías
      const orden = ['main', 'admin', 'owner', 'utilidad', 'descargas', 'diversion', 'busqueda', 'nsfw']
      const categoryMap = {
        main: 'PRINCIPAL',
        admin: 'ADMINISTRACIÓN',
        owner: 'OWNER',
        utilidad: 'HERRAMIENTAS',
        descargas: 'DESCARGAS',
        diversion: 'DIVERSIÓN',
        busqueda: 'BÚSQUEDAS',
        nsfw: 'CONTENIDO +18'
      }

      for (const cat of orden) {
        const cmds = mapa[cat]
        if (!cmds?.length) continue
        const nombre = categoryMap[cat] || cat.toUpperCase()
        menuTxt += buildCategoryBox(nombre, cmds, prefix, bullet)
        menuTxt += '\n'
      }

      await sock.sendMessage(from, {
        image:   { url: bot.defaultImg },
        caption: menuTxt
      }, { quoted: msg })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}