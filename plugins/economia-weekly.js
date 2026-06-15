// plugins/eco-semanal.js
import { getEconomy, addKryons, addXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const frases = [
  { texto: '🌸 Midori hizo balance de la semana y te recompensa por cuidar el jardín.', emoji: '🌸', kryons: [3000, 8000], xp: [80, 150] },
  { texto: '🌿 Siete días regando las plantas y el esfuerzo dio frutos.', emoji: '🌿', kryons: [3500, 8500], xp: [90, 160] },
  { texto: '🍃 Las hojas del calendario cayeron y Midori celebra tu constancia.', emoji: '🍃', kryons: [3200, 7800], xp: [85, 155] },
  { texto: '🦋 Una mariposa te siguió toda la semana, era Midori cuidándote. Hoy te premia.', emoji: '🦋', kryons: [4000, 9000], xp: [100, 170] },
  { texto: '🌻 Los girasoles del jardín crecieron gracias a tu dedicación semanal.', emoji: '🌻', kryons: [3800, 8800], xp: [95, 165] },
  { texto: '💮 Siete amaneceres en el jardín y cada uno trajo su bendición.', emoji: '💮', kryons: [3500, 8200], xp: [88, 158] },
  { texto: '🪷 El loto del estanque floreció justo hoy, buena señal. Midori te recompensa.', emoji: '🪷', kryons: [4200, 9500], xp: [105, 175] },
  { texto: '🌙 La luna llena marcó el cierre de semana y tu esfuerzo no pasó desapercibido.', emoji: '🌙', kryons: [3600, 8600], xp: [90, 160] },
  { texto: '🍯 Las abejas trabajaron y vos también. Midori reparte la miel dorada.', emoji: '🍯', kryons: [3300, 8000], xp: [82, 152] },
  { texto: '🎋 El bambú creció un palmo esta semana, igual que tu fortuna.', emoji: '🎋', kryons: [3700, 8700], xp: [92, 162] },
  { texto: '🌟 Las estrellas contaron tus buenas acciones y Midori te lo devuelve.', emoji: '🌟', kryons: [4500, 10000], xp: [110, 180] },
  { texto: '🕊️ Una paloma trajo noticias del cielo: tu semana fue bendecida.', emoji: '🕊️', kryons: [3400, 8300], xp: [86, 156] },
  { texto: '🌾 Cosechaste lo sembrado y el granero está lleno. Midori sonríe.', emoji: '🌾', kryons: [4000, 9200], xp: [100, 170] },
  { texto: '🐞 Siete catarinas te visitaron, una por cada día. La suerte te acompaña.', emoji: '🐞', kryons: [3800, 8900], xp: [95, 165] },
  { texto: '🎐 El carillón del porche sonó siete veces y Midori te abre el cofre semanal.', emoji: '🎐', kryons: [3600, 8500], xp: [88, 158] },
  { texto: '🪻 Las lavandas perfumaron tu casa toda la semana. Hoy recibes tu recompensa.', emoji: '🪻', kryons: [3500, 8400], xp: [87, 157] },
  { texto: '🍄 Los hongos del bosque brotaron de noche y Midori te da tu parte semanal.', emoji: '🍄', kryons: [3900, 9100], xp: [98, 168] },
  { texto: '📿 Siete cuentas de gratitud ensartaste y Midori las cambió por kryons.', emoji: '📿', kryons: [3700, 8600], xp: [90, 160] },
  { texto: '🌊 El mar devolvió siete caracolas y cada una traía una sorpresa.', emoji: '🌊', kryons: [4100, 9300], xp: [102, 172] },
  { texto: '💚 Tu corazón regó el jardín toda la semana. Midori te lo agradece con creces.', emoji: '💚', kryons: [4300, 9800], xp: [108, 178] },
]

export default {
  command: ['semanal', 'semana', 'cadasemana', 'weekly'],
  tag: 'semanal',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Recompensa semanal por habitar el jardín de Midori',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'semanal', 604800)
    if (!cd.ok) {
      const dias = Math.floor(cd.secsLeft / 86400)
      const horas = Math.floor((cd.secsLeft % 86400) / 3600)
      return sock.sendMessage(from, {
        text: `🌸 Ya recogiste tu recompensa semanal. Vuelve en *${dias} día(s) y ${horas} hora(s)*.`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'semanal')
    const frase = frases[Math.floor(Math.random() * frases.length)]
    const kryons = Math.floor(Math.random() * (frase.kryons[1] - frase.kryons[0] + 1)) + frase.kryons[0]
    const xp = Math.floor(Math.random() * (frase.xp[1] - frase.xp[0] + 1)) + frase.xp[0]

    addKryons(selfNum, kryons)
    addXp(selfNum, xp)

    await sock.sendMessage(from, { react: { text: frase.emoji, key: msg.key } })

    await sock.sendMessage(from, {
      text: `${frase.texto} Recibiste *${kryons.toLocaleString()} kryons* y *${xp} de exp*.`
    }, { quoted: msg })
  }
}