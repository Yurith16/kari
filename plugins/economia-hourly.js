// plugins/eco-hourly.js
import { getEconomy, addKryons, addXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const frases = [
  { texto: '⏳ Pasaste una hora en el jardín y Midori te recompensa por tu compañía.', emoji: '⏳', kryons: [150, 400], xp: [10, 20] },
  { texto: '🍵 Te tomaste un té con Midori y la charla valió la pena.', emoji: '🍵', kryons: [120, 350], xp: [8, 18] },
  { texto: '🪴 Regaste las plantitas del invernadero y Midori te da tu jornal.', emoji: '🪴', kryons: [130, 380], xp: [10, 18] },
  { texto: '📖 Leíste un cuento bajo el cerezo y las hadas te dejaron propina.', emoji: '📖', kryons: [140, 360], xp: [8, 20] },
  { texto: '🧹 Barriste las hojas del sendero principal y Midori valora tu ayuda.', emoji: '🧹', kryons: [100, 300], xp: [8, 16] },
  { texto: '🎵 Tarareaste una melodía y los pajaritos te trajeron kryons de agradecimiento.', emoji: '🎵', kryons: [160, 420], xp: [12, 22] },
  { texto: '🌸 Recogiste pétalos caídos y Midori los cambió por monedas.', emoji: '🌸', kryons: [110, 320], xp: [8, 18] },
  { texto: '🦆 Alimentaste a los patos del estanque y Midori te recompensa.', emoji: '🦆', kryons: [130, 370], xp: [10, 20] },
  { texto: '🌬️ El viento trajo semillas y vos las plantaste sin que nadie lo pidiera.', emoji: '🌬️', kryons: [140, 390], xp: [10, 20] },
  { texto: '🪜 Arreglaste la cerca del jardín y Midori notó tu buena voluntad.', emoji: '🪜', kryons: [150, 400], xp: [12, 22] },
  { texto: '💤 Descansaste bajo la sombra del manzano y la siesta te trajo suerte.', emoji: '💤', kryons: [120, 340], xp: [8, 18] },
  { texto: '🐿️ Una ardilla te trajo nueces y Midori las cambió por kryons.', emoji: '🐿️', kryons: [100, 310], xp: [8, 16] },
  { texto: '🕸️ Quitaste telarañas del viejo molino sin que nadie te lo pidiera.', emoji: '🕸️', kryons: [130, 360], xp: [10, 18] },
  { texto: '🎋 Cortaste bambú para los artesanos y Midori te dio tu parte.', emoji: '🎋', kryons: [140, 380], xp: [10, 20] },
  { texto: '🪷 Limpiaste el estanque de lotos y el agua cristalina trajo recompensa.', emoji: '🪷', kryons: [160, 410], xp: [12, 22] },
  { texto: '🧺 Doblaste las mantas del almacén y Midori te premia por ordenado.', emoji: '🧺', kryons: [110, 330], xp: [8, 16] },
  { texto: '🕯️ Encendiste faroles al atardecer y la luz atrajo la abundancia.', emoji: '🕯️', kryons: [120, 350], xp: [8, 18] },
  { texto: '🐌 Salvaste un caracol del camino y Midori aplaude tu ternura.', emoji: '🐌', kryons: [100, 300], xp: [8, 16] },
  { texto: '🍂 Juntaste hojas secas para el compost y el jardín te lo agradece.', emoji: '🍂', kryons: [130, 370], xp: [10, 18] },
  { texto: '🌻 Pusiste semillas de girasol en la tierra y Midori te adelantó la cosecha.', emoji: '🌻', kryons: [150, 400], xp: [12, 22] },
  { texto: '🪶 Encontraste plumas en el sendero y Midori las usa para decorar tu suerte.', emoji: '🪶', kryons: [110, 340], xp: [8, 18] },
  { texto: '🍯 Endulzaste el té con miel del panal y Midori te comparte el tesoro.', emoji: '🍯', kryons: [140, 380], xp: [10, 20] },
  { texto: '💮 Ataste deseos en el árbol de los sueños y uno ya se cumplió.', emoji: '💮', kryons: [160, 420], xp: [12, 24] },
  { texto: '🪻 Recolectaste lavanda para los saquitos aromáticos del pueblo.', emoji: '🪻', kryons: [120, 350], xp: [10, 18] },
  { texto: '🐞 Guiaste una catarina hasta una hoja verde y Midori sonrió.', emoji: '🐞', kryons: [100, 310], xp: [8, 16] },
  { texto: '🌾 Aventaste el trigo en el granero y Midori te paga la hora.', emoji: '🌾', kryons: [130, 360], xp: [10, 20] },
  { texto: '🎐 Colgaste carillones nuevos en el porche y el sonido llamó la fortuna.', emoji: '🎐', kryons: [140, 390], xp: [10, 20] },
  { texto: '🍄 Recolectaste hongos del bosque y Midori los vendió en la feria por vos.', emoji: '🍄', kryons: [150, 400], xp: [12, 22] },
  { texto: '📿 Ensartaste cuentas para collares y Midori te recompensa el arte.', emoji: '📿', kryons: [120, 340], xp: [8, 18] },
  { texto: '🪨 Apilaste piedras zen en el jardín y el equilibrio trajo kryons.', emoji: '🪨', kryons: [130, 370], xp: [10, 18] },
]

export default {
  command: ['hourly', 'hora', 'cadahora'],
  tag: 'hourly',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Recompensa cada hora por habitar el jardín de Midori',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'hourly', 3600)
    if (!cd.ok) {
      const mins = Math.ceil(cd.secsLeft / 60)
      return sock.sendMessage(from, {
        text: `> 🌸 Aún no pasa una hora. Vuelve en *${mins}* minuto(s).`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'hourly')
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