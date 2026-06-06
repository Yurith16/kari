import db from '../core/sqlite.js'
import { cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

const _getSolteros = db.prepare(`
  SELECT user_num, nombre, apodo, edad, genero, pais
  FROM users
  WHERE nombre != '' AND estado = 'soltero' AND edad >= 15
`)

export default {
  command:     'solteros',
  tag:         'solteros',
  categoria:   'main',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Muestra los solteros del grupo',

  async execute(sock, msg, { from }) {
    try {
      const meta     = await sock.groupMetadata(from)
      const miembros = new Set()

      for (const p of meta.participants) {
        const pid = p.id

        // Número normal — extraer directo sin petición
        if (pid.endsWith('@s.whatsapp.net')) {
          const num = cleanNumber(pid)
          if (num) miembros.add(num)
          continue
        }

        // @lid — buscar en caché global primero (llenado al conectar)
        if (pid.endsWith('@lid')) {
          const cached = global.lidCache?.get(pid)
          if (cached) {
            const num = cleanNumber(cached)
            if (num) miembros.add(num)
            continue
          }

          // Solo si no está en caché intentar resolverlo
          // (caso raro, usuario que entró después del arranque)
          if (p.phoneNumber) {
            const num = cleanNumber(p.phoneNumber)
            if (num) miembros.add(num)
          }
          continue
        }

        // Cualquier otro formato — limpiar directo
        const num = cleanNumber(pid)
        if (num) miembros.add(num)
      }

      const todosSolteros = _getSolteros.all()
      const solteros      = todosSolteros.filter(s => miembros.has(s.user_num))

      if (!solteros.length) {
        return sock.sendMessage(from, {
          text: '🌸 En este grupo no hay solteros disponibles.'
        }, { quoted: msg })
      }

      const generoEmoji = (g) => g === 'hombre' ? '👦' : g === 'mujer' ? '👧' : '🌿'
      const mentions    = solteros.map(s => `${s.user_num}@s.whatsapp.net`)

      let txt = `╭─〔 ${toBold('💚 SOLTEROS DEL GRUPO')} 〕\n`
      txt += `│\n`

      solteros.forEach(s => {
        txt += `│ ${generoEmoji(s.genero)} @${s.user_num}\n`
        txt += `│    ✦ ${s.edad} años · ${s.pais}\n`
      })

      txt += `│\n`
      txt += `│ 🌸 ${solteros.length} soltero${solteros.length !== 1 ? 's' : ''} en este grupo\n`
      txt += `╰─── ── ── ── ──\n`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })

    } catch (err) {
      console.error('[solteros] Error:', err.message)
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}