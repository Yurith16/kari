// plugins/solteros.js

import db from '../core/sqlite.js'
import { cleanNumber, getRealJid } from '../utils/jid.js'
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
      const meta = await sock.groupMetadata(from)
      
      // Resolver JID real de cada miembro para obtener su número
      const miembros = []
      for (const p of meta.participants) {
        try {
          const realJid = await getRealJid(sock, p.id, { key: { remoteJid: from } })
          const num = cleanNumber(realJid)
          if (num) miembros.push(num)
        } catch {
          const num = cleanNumber(p.id)
          if (num) miembros.push(num)
        }
      }

      //console.log('[solteros] Miembros del grupo:', miembros)

      const todosSolteros = _getSolteros.all()
      
      //console.log('[solteros] Solteros en DB:', todosSolteros.map(s => s.user_num))
      
      const solteros = todosSolteros.filter(s => miembros.includes(s.user_num))

      //console.log('[solteros] Solteros en el grupo:', solteros.map(s => s.user_num))

      if (!solteros.length) {
        return sock.sendMessage(from, {
          text: '🌸 En este grupo no hay solteros disponibles.'
        }, { quoted: msg })
      }

      const generoEmoji = (g) => g === 'hombre' ? '👦' : g === 'mujer' ? '👧' : '🌿'
      const mentions = solteros.map(s => `${s.user_num}@s.whatsapp.net`)

      let txt = `╭─〔 ${toBold('💚 SOLTEROS DEL GRUPO')} 〕\n`
      txt += `│\n`

      solteros.forEach(s => {
        const nombre = s.apodo || s.nombre
        txt += `│ ${generoEmoji(s.genero)} @${s.user_num}\n`
        txt += `│    ✦ ${s.edad} años · ${s.pais}\n`
      })

      txt += `│\n`
      txt += `│ 🌸 ${solteros.length} solteros en este grupo\n`
      txt += `╰─── ── ── ── ──\n`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })

    } catch (err) {
      console.error('[solteros] Error:', err.message)
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}