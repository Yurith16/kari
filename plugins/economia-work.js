// plugins/eco-trabajar.js
import { getEconomy, addKryons, addXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const frases = [
  { texto: '🧹 Barriste el templo del pueblo y el monje te dio', emoji: '🧹', kryons: [200, 500], xp: [15, 30] },
  { texto: '🌾 Ayudaste en la cosecha de arroz y el granjero te pagó', emoji: '🌾', kryons: [250, 550], xp: [18, 32] },
  { texto: '🎣 Saliste a pescar al río y vendiste la pesca por', emoji: '🎣', kryons: [180, 450], xp: [12, 28] },
  { texto: '🪵 Cortaste leña para la abuela del monte y te recompensó con', emoji: '🪵', kryons: [220, 480], xp: [15, 30] },
  { texto: '🍞 Horneaste pan para la posada y el dueño te pagó', emoji: '🍞', kryons: [200, 500], xp: [14, 28] },
  { texto: '🧵 Cosiste vestidos para la feria y las señoras te dieron', emoji: '🧵', kryons: [230, 520], xp: [16, 30] },
  { texto: '📦 Cargaste bultos en el mercado y los comerciantes te soltaron', emoji: '📦', kryons: [180, 420], xp: [12, 26] },
  { texto: '🐄 Ordeñaste las vacas del establo y vendiste la leche por', emoji: '🐄', kryons: [210, 490], xp: [14, 28] },
  { texto: '🕯️ Hiciste velas aromáticas y las vendiste en la plaza por', emoji: '🕯️', kryons: [240, 530], xp: [16, 32] },
  { texto: '🌿 Recolectaste hierbas medicinales para el boticario. Te pagó', emoji: '🌿', kryons: [260, 560], xp: [18, 34] },
  { texto: '🏮 Repartiste faroles para la fiesta del pueblo y juntaste', emoji: '🏮', kryons: [190, 440], xp: [13, 28] },
  { texto: '🎨 Pintaste letreros para los negocios y te ganaste', emoji: '🎨', kryons: [250, 550], xp: [17, 32] },
  { texto: '🪴 Trasplantaste flores en el vivero y Midori te pagó', emoji: '🪴', kryons: [220, 500], xp: [15, 30] },
  { texto: '🍯 Cosechaste miel del panal sin que te picaran. Vendiste por', emoji: '🍯', kryons: [270, 580], xp: [18, 35] },
  { texto: '🎋 Cortaste bambú para los artesanos y te dieron', emoji: '🎋', kryons: [200, 470], xp: [14, 28] },
  { texto: '📿 Ensartaste collares de semillas y los turistas pagaron', emoji: '📿', kryons: [240, 540], xp: [16, 30] },
  { texto: '🪨 Apilaste piedras zen en los jardines y te pagaron', emoji: '🪨', kryons: [190, 430], xp: [12, 26] },
  { texto: '🧺 Lavaste ropa en el río para las vecinas y juntaste', emoji: '🧺', kryons: [180, 400], xp: [12, 25] },
  { texto: '🍄 Buscaste hongos en el bosque y el chef te compró por', emoji: '🍄', kryons: [260, 570], xp: [18, 34] },
  { texto: '🎐 Colgaste carillones en las casas y los vecinos te dieron', emoji: '🎐', kryons: [210, 480], xp: [14, 28] },
  { texto: '🐑 Esquilaste ovejas en la granja y vendiste la lana por', emoji: '🐑', kryons: [230, 510], xp: [16, 30] },
  { texto: '🪜 Reparaste techos de paja en las cabañas y te pagaron', emoji: '🪜', kryons: [250, 540], xp: [17, 32] },
  { texto: '💧 Acarreaste agua del pozo para las ancianas y te recompensaron con', emoji: '💧', kryons: [170, 380], xp: [10, 24] },
  { texto: '🌻 Plantaste girasoles en la entrada del pueblo y Midori te pagó', emoji: '🌻', kryons: [240, 520], xp: [16, 30] },
  { texto: '🧹 Limpiaste el establo de los caballos y el dueño te dio', emoji: '🧹', kryons: [200, 460], xp: [14, 28] },
  { texto: '🎪 Ayudaste a armar la carpa del circo y te pagaron', emoji: '🎪', kryons: [260, 560], xp: [18, 34] },
  { texto: '🛖 Pintaste cercas en las afueras y el capataz te soltó', emoji: '🛖', kryons: [190, 440], xp: [13, 26] },
  { texto: '🐓 Alimentaste las gallinas y recogiste huevos para vender. Sacaste', emoji: '🐓', kryons: [180, 410], xp: [12, 25] },
  { texto: '🧴 Hiciste ungüentos con sábila y los vendiste casa por casa por', emoji: '🧴', kryons: [250, 550], xp: [17, 32] },
  { texto: '📚 Leyó cuentos a los niños en la plaza y los padres te juntaron', emoji: '📚', kryons: [200, 450], xp: [14, 28] },
]

export default {
  command: ['work', 'trabajo', 'chamba', 'faena', 'trabajar', 'chambear'],
  tag: 'trabajar',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Trabaja en el pueblo para ganar kryons',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'trabajar', 600)
    if (!cd.ok) {
      const mins = Math.ceil(cd.secsLeft / 60)
      return sock.sendMessage(from, {
        text: `🌸 Ya trabajaste bastante por hoy. Descansa *${mins}* minuto(s).`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'trabajar')
    const frase = frases[Math.floor(Math.random() * frases.length)]
    const kryons = Math.floor(Math.random() * (frase.kryons[1] - frase.kryons[0] + 1)) + frase.kryons[0]
    const xp = Math.floor(Math.random() * (frase.xp[1] - frase.xp[0] + 1)) + frase.xp[0]

    addKryons(selfNum, kryons)
    addXp(selfNum, xp)

    await sock.sendMessage(from, { react: { text: frase.emoji, key: msg.key } })

    await sock.sendMessage(from, {
      text: `${frase.texto} *${kryons.toLocaleString()} kryons* y *${xp} de exp*.`
    }, { quoted: msg })
  }
}