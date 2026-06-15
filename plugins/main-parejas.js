import db from '../core/sqlite.js'
import { cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

const _getParejas = db.prepare(`
  SELECT u1.user_num, u1.nombre,
         u2.user_num as pareja_num, u2.nombre as pareja_nombre,
         u1.estado, u1.noviazgo_fecha, u1.matrimonio_fecha
  FROM users u1
  JOIN users u2 ON u1.pareja = u2.user_num
  WHERE u1.nombre != ''
    AND u1.estado IN ('en_relacion', 'casado')
    AND u1.user_num < u1.pareja
`)

function tiempoTranscurrido(timestamp) {
  if (!timestamp || timestamp === 0) return null
  const ahora = Math.floor(Date.now() / 1000)
  const diff  = ahora - timestamp
  const dias  = Math.floor(diff / 86400)
  const meses = Math.floor(dias / 30)
  const años  = Math.floor(dias / 365)
  if (años  > 0) return `${años} año${años > 1 ? 's' : ''}`
  if (meses > 0) return `${meses} mes${meses > 1 ? 'es' : ''}`
  if (dias  > 0) return `${dias} día${dias > 1 ? 's' : ''}`
  return 'Hoy'
}

export default {
  command:     'parejas',
  tag:         'parejas',
  categoria:   'main',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Muestra las parejas del grupo',

  async execute(sock, msg, { from }) {
    try {
      const meta     = await sock.groupMetadata(from)
      const miembros = new Set()

      for (const p of meta.participants) {
        const pid = p.id
        if (pid.endsWith('@s.whatsapp.net')) {
          const num = cleanNumber(pid)
          if (num) miembros.add(num)
          continue
        }
        if (pid.endsWith('@lid')) {
          const cached = global.lidCache?.get(pid)
          if (cached) {
            const num = cleanNumber(cached)
            if (num) miembros.add(num)
            continue
          }
          if (p.phoneNumber) {
            const num = cleanNumber(p.phoneNumber)
            if (num) miembros.add(num)
          }
          continue
        }
        const num = cleanNumber(pid)
        if (num) miembros.add(num)
      }

      const todasParejas = _getParejas.all()
      const parejas      = todasParejas.filter(p =>
        miembros.has(p.user_num) && miembros.has(p.pareja_num)
      )

      if (!parejas.length) {
        return sock.sendMessage(from, {
          text: '🌸 No hay parejas en este grupo aún.'
        }, { quoted: msg })
      }

      let txt = `╭〔 💑 *PAREJAS DEL GRUPO* 〕╮\n\n`

      parejas.forEach((p, i) => {
        const esCasado = p.estado === 'casado'
        const emoji    = esCasado ? '💍' : '💑'
        const tiempo   = tiempoTranscurrido(esCasado ? p.matrimonio_fecha : p.noviazgo_fecha)
        const estado   = esCasado ? 'Casados' : 'Novios'

        txt += `> ✦ *${emoji} Pareja ${i + 1}*\n`
        txt += `> ✦ *${p.nombre}* y *${p.pareja_nombre}*\n`
        txt += `> ✦ *Estado:* ${estado}\n`
        if (tiempo) txt += `> ✦ *Juntos:* ${tiempo}\n`
        txt += `\n`
      })

      txt += `───────────────────\n`
      txt += `🌸 *${parejas.length} pareja${parejas.length !== 1 ? 's' : ''}* en este grupo\n`
      txt += `🌿 ${toBold(global.bot?.name || 'Bot')}`

      await sock.sendMessage(from, { text: txt }, { quoted: msg })

    } catch (err) {
      console.error('[parejas] Error:', err.message)
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}