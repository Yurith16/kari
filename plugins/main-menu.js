import { toBold, toMono } from '../utils/helpers.js'
import { commands }       from '../core/plugins.js'
import db                 from '../core/sqlite.js'
import bot                from '../settings/bot.js'

const startTime = Date.now()

function uptime() {
  const ms = Date.now() - startTime
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor(ms / 60000) % 60
  const s  = Math.floor(ms / 1000) % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
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

function buildCategoryBox(catName, cmds, descMap, prefix) {
  const emojis = ['📍', '🌸', '🌼', '🌴', '🌱', '🙊']
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]
  
  let txt = `✥------- ${toMono(catName.toUpperCase())} -------✥\n\n`
  cmds.sort().forEach(cmd => {
    txt += `${emoji} *${prefix}${cmd}*\n`
    const desc = descMap[cmd]
    if (desc) txt += `> ↳ _${desc}_\n`
  })
  return txt
}

export default {
  command: 'menu',
  tag: 'menu',
  categoria: 'main',
  descripcion: 'Muestra todo lo que puedo hacer',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, prefix }) {
    try {
      const ping = Date.now()
      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })
      const latency = Date.now() - ping

      const botName = bot.name || 'Midori-Hana'

      const seen    = new Set()
      const mapa    = {}
      const descMap = {}
      let   total   = 0

      for (const p of commands.values()) {
        if (!p.command || !p.categoria) continue
        const name = p.tag || (Array.isArray(p.command) ? p.command[0] : p.command)
        if (seen.has(name)) continue
        seen.add(name)
        const cat = p.categoria || 'main'
        if (!mapa[cat]) mapa[cat] = []
        mapa[cat].push(name)
        descMap[name] = p.descripcion || ''
        total++
      }

      let grupos = 0
      try {
        const g = await sock.groupFetchAllParticipating()
        grupos = Object.keys(g).length
      } catch {}

      let totalUsuarios = 0
      try {
        const row = db.prepare(`SELECT COUNT(*) as count FROM users`).get()
        totalUsuarios = row?.count || 0
      } catch (e) {
        console.error('Error al obtener el conteo de usuarios:', e)
      }

      const fecha = getDate()
      const hora  = getTime()

      let menuTxt = `╭─〔 🌸 *${toMono(botName.toUpperCase())}* 🌸 〕─╮\n\n`
      menuTxt += `> ✦ *Fecha:* ${fecha}\n`
      menuTxt += `> ✦ *Hora:* ${hora} · Honduras\n`
      menuTxt += `> ✦ *Dueño:* ${bot.owner || 'Hernandez'}\n`
      menuTxt += `> ✦ *Contacto:* +${bot.ownerNumber?.[0] || ''}\n`
      menuTxt += `> ✦ *Bot Principal:* +${bot.botNumber || ''}\n`
      menuTxt += `> ✦ *Versión:* ${bot.version || '1.0.0'}\n`
      menuTxt += `> ✦ *Prefijo:* ${prefix}\n`
      menuTxt += `> ✦ *Activo:* ${uptime()}\n`
      menuTxt += `> ✦ *Grupos:* ${grupos}\n`
      menuTxt += `> ✦ *Latencia:* ${latency}ms\n`
      menuTxt += `> ✦ *Usuarios:* ${totalUsuarios}\n`
      menuTxt += `> ✦ *Comandos:* ${total}\n`

      if (bot.grupoOficial) {
        menuTxt += `> ✦ *Grupo Oficial:* ${bot.grupoOficial}\n`
      }

      menuTxt += `\n_Hazme trabajar duro hoy, que para eso estoy aquí..._ 🤭\n\n`

      const orden = ['main', 'admin', 'economia', 'diversion', 'juego', 'busqueda', 'descargas', 'utilidad', 'nsfw', 'owner']
      const categoryMap = {
        main:      'PRINCIPAL',
        admin:     'ADMINISTRACIÓN',
        economia:  'ECONOMÍA',
        diversion: 'DIVERSIÓN',
        juego:     'JUEGOS',
        busqueda:  'BÚSQUEDAS',
        descargas: 'DESCARGAS',
        utilidad:  'HERRAMIENTAS',
        nsfw:      'CONTENIDO +18',
        owner:     'OWNER'
      }

      for (const cat of orden) {
        const cmds = mapa[cat]
        if (!cmds?.length) continue
        const nombre = categoryMap[cat] || cat.toUpperCase()
        menuTxt += buildCategoryBox(nombre, cmds, descMap, prefix)
        menuTxt += '\n'
      }

      menuTxt += `_🌸 ¿Te vas a quedar un rato más conmigo o solo viniste por mis funciones? No me dejes en visto..._`

      try {
        await sock.sendMessage(from, {
          image: { url: bot.defaultImg },
          caption: menuTxt
        }, { quoted: msg })
      } catch {
        await sock.sendMessage(from, { text: menuTxt }, { quoted: msg })
      }

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}