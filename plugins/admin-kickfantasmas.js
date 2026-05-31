import db from '../core/sqlite.js'
import { cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

const _getActive = db.prepare(`SELECT user FROM activity WHERE group_id = ? AND msgs > 0`)

const enProceso   = new Set()
const pendingConf = new Map()

export default {
  command:   ['kickfantasmas', 'expulsarfantasmas', 'limpiarinactivos', 'kikinactivos'],
  tag:       'kickfantasmas',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Expulsa a los miembros sin actividad del grupo',

  async onMessage(sock, msg, { from, text, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) return
    if (!pendingConf.has(from)) return

    const { fantasmas, timestamp } = pendingConf.get(from)

    if (Date.now() - timestamp > 30_000) {
      pendingConf.delete(from)
      return
    }

    const respuesta = text?.trim().toLowerCase()
    if (respuesta !== 'si' && respuesta !== 'sí' && respuesta !== 'no') return

    pendingConf.delete(from)

    if (respuesta === 'no') {
      await sock.sendMessage(from, {
        text: '✦ Operación cancelada.'
      }, { quoted: msg })
      return
    }

    if (enProceso.has(from)) {
      await sock.sendMessage(from, {
        text: '⏳ Ya hay una limpieza en proceso en este grupo.'
      }, { quoted: msg })
      return
    }

    enProceso.add(from)

    await sock.sendMessage(from, {
      text: `⚙️ Iniciando limpieza...\n✦ ${fantasmas.length} usuario${fantasmas.length !== 1 ? 's' : ''} serán expulsados.\n✦ Intervalo: 5 segundos por usuario.`
    }, { quoted: msg })

    let expulsados = 0
    let fallidos   = 0

    for (const fantasma of fantasmas) {
      await new Promise(r => setTimeout(r, 5000))
      try {
        await sock.groupParticipantsUpdate(from, [`${fantasma.num}@s.whatsapp.net`], 'remove')
        expulsados++
      } catch {
        fallidos++
      }
    }

    enProceso.delete(from)

    await sock.sendMessage(from, {
      text: `✦ Limpieza completada.\n✦ Expulsados: *${expulsados}*\n✦ Fallidos: *${fallidos}*\n✦ Tiempo estimado: ${((expulsados + fallidos) * 5 / 60).toFixed(1)} minutos`
    }, { quoted: msg })
  },

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    if (enProceso.has(from)) {
      await sock.sendMessage(from, {
        text: '⏳ Ya hay una limpieza en proceso en este grupo. Espera a que termine.'
      }, { quoted: msg })
      return
    }

    try {
      const meta    = await sock.groupMetadata(from)
      const members = meta.participants
      const activos = new Set(_getActive.all(from).map(r => r.user))

      const fantasmas = members.map(p => {
        let num = cleanNumber(p.id)
        if (p.id.endsWith('@lid') || num.length > 13) {
          const cached = global.lidCache?.get(p.id)
          if (cached) num = cleanNumber(cached)
        }
        if (p.phoneNumber) {
          const fromPhone = cleanNumber(p.phoneNumber)
          if (fromPhone.length >= 8) num = fromPhone
        }
        return { jid: p.id, num, admin: p.admin }
      }).filter(m =>
        m.num && m.num.length >= 8 && m.num.length <= 15 &&
        !m.admin &&
        !activos.has(m.num)
      )

      if (!fantasmas.length) {
        await sock.sendMessage(from, {
          text: '✦ No se detectaron fantasmas. Todos los miembros tienen actividad registrada.'
        }, { quoted: msg })
        return
      }

      const tiempoEst = ((fantasmas.length * 5) / 60).toFixed(1)

      pendingConf.set(from, { fantasmas, timestamp: Date.now() })

      await sock.sendMessage(from, {
        text: `╭─〔 ${toBold('KICKFANTASMAS')} 〕\n` +
          `│\n` +
          `│ ✦ *Fantasmas detectados:* ${fantasmas.length}\n` +
          `│ ✦ *Miembros activos:* ${activos.size}\n` +
          `│ ✦ *Total grupo:* ${members.length}\n` +
          `│ ✦ *Tiempo estimado:* ${tiempoEst} min\n` +
          `│\n` +
          `│ ⚠️ Esta acción expulsará a *${fantasmas.length}* usuario${fantasmas.length !== 1 ? 's' : ''} sin actividad.\n` +
          `│\n` +
          `╰─── ¿Desea continuar? Responda *si* o *no*`
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}