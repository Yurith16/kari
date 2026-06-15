// plugins/eco-cofre.js
import { addKryons, addXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const cofres = [
  { texto: '📦 Abriste un cofre de madera y encontraste', emoji: '📦', kryons: [100, 800], xp: [10, 25] },
  { texto: '📦 Abriste un cofre de madera y encontraste', emoji: '📦', kryons: [100, 800], xp: [10, 25] },
  { texto: '📦 Abriste un cofre de madera y encontraste', emoji: '📦', kryons: [100, 800], xp: [10, 25] },
  { texto: '📦 Abriste un cofre de madera y encontraste', emoji: '📦', kryons: [100, 800], xp: [10, 25] },
  { texto: '🔑 Forzaste un cofre oxidado y dentro había', emoji: '🔑', kryons: [500, 2000], xp: [15, 35] },
  { texto: '🔑 Forzaste un cofre oxidado y dentro había', emoji: '🔑', kryons: [500, 2000], xp: [15, 35] },
  { texto: '🔑 Forzaste un cofre oxidado y dentro había', emoji: '🔑', kryons: [500, 2000], xp: [15, 35] },
  { texto: '🔑 Forzaste un cofre oxidado y dentro había', emoji: '🔑', kryons: [500, 2000], xp: [15, 35] },
  { texto: '💎 Descubriste un cofre de cristal brillante con', emoji: '💎', kryons: [1500, 5000], xp: [20, 45] },
  { texto: '💎 Descubriste un cofre de cristal brillante con', emoji: '💎', kryons: [1500, 5000], xp: [20, 45] },
  { texto: '💎 Descubriste un cofre de cristal brillante con', emoji: '💎', kryons: [1500, 5000], xp: [20, 45] },
  { texto: '🏆 Abriste un cofre legendario y te dejó', emoji: '🏆', kryons: [4000, 12000], xp: [30, 60] },
  { texto: '🏆 Abriste un cofre legendario y te dejó', emoji: '🏆', kryons: [4000, 12000], xp: [30, 60] },
  { texto: '👑 ¡El cofre real se abrió ante ti! Contenía', emoji: '👑', kryons: [8000, 25000], xp: [40, 80] },
  { texto: '🌙 Un cofre encantado apareció en el jardín, adentro había', emoji: '🌙', kryons: [10000, 35000], xp: [50, 100] },
]

export default {
  command: ['cofre', 'chest', 'cofremagico'],
  tag: 'cofre',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Abre un cofre misterioso cada 3 horas',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'cofre', 10800)
    if (!cd.ok) {
      const horas = Math.floor(cd.secsLeft / 3600)
      const mins = Math.ceil((cd.secsLeft % 3600) / 60)
      return sock.sendMessage(from, {
        text: `> 🌸 El cofre aún no reaparece. Vuelve en *${horas}h ${mins}min*.`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'cofre')

    const cofre = cofres[Math.floor(Math.random() * cofres.length)]
    const kryons = Math.floor(Math.random() * (cofre.kryons[1] - cofre.kryons[0] + 1)) + cofre.kryons[0]
    const xp = Math.floor(Math.random() * (cofre.xp[1] - cofre.xp[0] + 1)) + cofre.xp[0]

    addKryons(selfNum, kryons)
    addXp(selfNum, xp)

    await sock.sendMessage(from, { react: { text: cofre.emoji, key: msg.key } })

    await sock.sendMessage(from, {
      text: `> ${cofre.texto} *${kryons.toLocaleString()} kryons* y *${xp} de exp*.`
    }, { quoted: msg })
  }
}