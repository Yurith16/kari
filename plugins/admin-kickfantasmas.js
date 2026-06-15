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
        text: '_Operación cancelada._'
      }, { quoted: msg })
      return
    }

    if (enProceso.has(from)) {
      await sock.sendMessage(from, {
        text: '_Ya hay una limpieza en proceso en este grupo._'
      }, { quoted: msg })
      return
    }

    enProceso.add(from)

    await sock.sendMessage(from, {
      text: `_Iniciando limpieza..._\n> ✦ *Usuarios:* ${fantasmas.length}\n> ✦ *Intervalo:* 5 segundos por usuario.`
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
      text: `_Limpieza completada._\n> ✦ *Expulsados:* ${expulsados}\n> ✦ *Fallidos:* ${fallidos}\n> ✦ *Tiempo:* ${((expulsados + fallidos) * 5 / 60).toFixed(1)} min`
    }, { quoted: msg })
  },

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '💀', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    if (enProceso.has(from)) {
      await sock.sendMessage(from, {
        text: '_Ya hay una limpieza en proceso, espera a que termine._'
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
          text: '_No se detectaron fantasmas, todos tienen actividad._'
        }, { quoted: msg })
        return
      }

      const tiempoEst = ((fantasmas.length * 5) / 60).toFixed(1)

      pendingConf.set(from, { fantasmas, timestamp: Date.now() })

      let txt = `𝙺𝙸𝙲𝙺 𝙵𝙰𝙽𝚃𝙰𝚂𝙼𝙰𝚂\n`
      txt += `⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱\n\n`
      txt += `> ✦ *Fantasmas:* ${fantasmas.length}\n`
      txt += `> ✦ *Activos:* ${activos.size}\n`
      txt += `> ✦ *Total:* ${members.length}\n`
      txt += `> ✦ *Tiempo est.:* ${tiempoEst} min\n\n`
      txt += `_¿Deseas continuar? Responde *si* o *no*_`

      await sock.sendMessage(from, { text: txt }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}