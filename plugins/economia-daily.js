// plugins/eco-diario.js
import { getEconomy, addKryons, addXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const frases = [
  { texto: '🌸 El sol salió puntual y Midori te recompensa por madrugar.', emoji: '☀️', kryons: [800, 3000], xp: [30, 50] },
  { texto: '🌻 Hoy el jardín amaneció florecido y la brisa te trajo algo especial.', emoji: '🌻', kryons: [1000, 3500], xp: [25, 45] },
  { texto: '🍃 Recolectaste el rocío de la mañana y Midori lo cambió por kryons.', emoji: '🍃', kryons: [900, 3200], xp: [28, 48] },
  { texto: '🦋 Una mariposa se posó en tu ventana, buena señal. El universo te premia.', emoji: '🦋', kryons: [1200, 4000], xp: [32, 52] },
  { texto: '☕ Te preparaste un café y encontraste kryons en el fondo de la taza.', emoji: '☕', kryons: [800, 2800], xp: [20, 40] },
  { texto: '🌈 Pasó la lluvia y el arcoíris dejó un cofrecito con tu nombre.', emoji: '🌈', kryons: [1500, 4500], xp: [35, 55] },
  { texto: '🐦 Un pajarito cantó en tu ventana y Midori escuchó tu nombre en su trino.', emoji: '🐦', kryons: [900, 3300], xp: [26, 46] },
  { texto: '🌾 Cosechaste trigo dorado en el campo de los sueños y valió la pena.', emoji: '🌾', kryons: [1100, 3800], xp: [30, 50] },
  { texto: '🍀 Encontraste un trébol de cuatro hojas camino al pozo. La suerte te sonríe.', emoji: '🍀', kryons: [1800, 5000], xp: [38, 58] },
  { texto: '🌸 Midori regó las flores del pueblo y de paso dejó kryons en tu puerta.', emoji: '🚿', kryons: [1000, 3400], xp: [28, 48] },
  { texto: '🕊️ Una paloma mensajera te trajo un sobre con kryons desde lejos.', emoji: '🕊️', kryons: [900, 3100], xp: [25, 45] },
  { texto: '🍂 El viento de otoño sopló y a tus pies cayeron kryons dorados.', emoji: '🍂', kryons: [1000, 3500], xp: [27, 47] },
  { texto: '🌟 Pediste un deseo anoche y Midori lo hizo realidad al despertar.', emoji: '🌟', kryons: [2000, 5000], xp: [40, 60] },
  { texto: '🐌 Un caracol llevó kryons en su caparazón hasta tu jardín sin prisa.', emoji: '🐌', kryons: [800, 2900], xp: [22, 42] },
  { texto: '🎋 El bambú susurró tu nombre y las hadas del bosque te recompensaron.', emoji: '🎋', kryons: [1300, 4200], xp: [33, 53] },
  { texto: '💮 Las flores de cerezo bailaron y una ramita dejó kryons en tu mano.', emoji: '💮', kryons: [1100, 3900], xp: [31, 51] },
  { texto: '🪷 Del estanque brotó un loto con kryons en sus pétalos, solo para vos.', emoji: '🪷', kryons: [1600, 4800], xp: [36, 56] },
  { texto: '🌙 La luna te vio dormir tranquilo y Midori te dejó un regalo al alba.', emoji: '🌙', kryons: [1000, 3600], xp: [29, 49] },
  { texto: '🍯 Las abejas trabajaron para vos y Midori te entrega su miel dorada.', emoji: '🍯', kryons: [900, 3000], xp: [24, 44] },
  { texto: '🪶 Una pluma celeste cayó del cielo con kryons atados a su extremo.', emoji: '🪶', kryons: [1000, 3400], xp: [27, 47] },
  { texto: '🌊 El mar devolvió un mensaje en botella y adentro había kryons.', emoji: '🌊', kryons: [1200, 4000], xp: [32, 52] },
  { texto: '🐾 Tus mascotas encontraron kryons enterrados en el patio y te los trajeron.', emoji: '🐾', kryons: [850, 3000], xp: [23, 43] },
  { texto: '🎐 El tintineo del carillón trajo buena fortuna a tu hogar esta mañana.', emoji: '🎐', kryons: [950, 3300], xp: [26, 46] },
  { texto: '🧺 Tendiste la ropa al sol y en los pliegues aparecieron kryons brillantes.', emoji: '🧺', kryons: [800, 2700], xp: [21, 41] },
  { texto: '🌿 Las hierbas del huerto crecieron de noche y Midori te da tu parte.', emoji: '🌿', kryons: [1000, 3500], xp: [28, 48] },
  { texto: '🕯️ Encendiste una vela por la mañana y la llama trajo prosperidad.', emoji: '🕯️', kryons: [950, 3200], xp: [25, 45] },
  { texto: '📿 Contaste tus bendiciones y Midori sumó kryons a la lista.', emoji: '📿', kryons: [1100, 3800], xp: [30, 50] },
  { texto: '🪻 Las lavandas del campo perfumaron tu día y atrajeron la abundancia.', emoji: '🪻', kryons: [1000, 3400], xp: [27, 47] },
  { texto: '🍄 Crecieron hongos en el tronco viejo y Midori los cambió por tesoros.', emoji: '🍄', kryons: [1400, 4400], xp: [34, 54] },
  { texto: '🐞 Una catarina se subió a tu hombro y Midori dice que es día de suerte.', emoji: '🐞', kryons: [1200, 3900], xp: [31, 51] },
]

export default {
  command: ['daily', 'diario'],
  tag: 'diario',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Recompensa diaria por ser parte del jardín',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'diario', 86400)
    if (!cd.ok) {
      const horas = Math.floor(cd.secsLeft / 3600)
      const mins = Math.ceil((cd.secsLeft % 3600) / 60)
      return sock.sendMessage(from, {
        text: `> 🌸 Ya recogiste tu regalo hoy. Vuelve en *${horas}h ${mins}min*.`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'diario')
    const frase = frases[Math.floor(Math.random() * frases.length)]
    const kryons = Math.floor(Math.random() * (frase.kryons[1] - frase.kryons[0] + 1)) + frase.kryons[0]
    const xp = Math.floor(Math.random() * (frase.xp[1] - frase.xp[0] + 1)) + frase.xp[0]

    addKryons(selfNum, kryons)
    addXp(selfNum, xp)

    await sock.sendMessage(from, { react: { text: frase.emoji, key: msg.key } })

    await sock.sendMessage(from, {
      text: `> ${frase.texto} Recibiste *${kryons.toLocaleString()} kryons* y *${xp} de exp*.`
    }, { quoted: msg })
  }
}