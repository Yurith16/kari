// plugins/daily.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 24 * 60 * 60 // 24 horas

export default {
  command:     ['daily', 'diario'],
  tag:         'daily',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Reclama tu gran recompensa diaria de kryons y experiencia',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'daily', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌿 La naturaleza necesita tiempo para florecer. Vuelve a por tu recompensa en *${formatCooldown(cd.secsLeft)}*.`
      }, { quoted: msg })
    }

    // Recompensas aumentadas por la espera de 24 horas
    const ganancia = Math.floor(Math.random() * 10000) + 5000 // 5000-15000 kryons
    const xp = Math.floor(Math.random() * 800) + 200 // 200-1000 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'daily')

    const frases = [
      `🌅 El rocío de la mañana iluminó tu camino. Recibes *${ganancia.toLocaleString()}* kryons y *${xp}* XP para empezar el día.`,
      `🌱 Una semilla de esmeralda brotó en tu jardín, otorgándote *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `💌 Alguien que te extraña en secreto te dejó un sobre con *${ganancia.toLocaleString()}* kryons y *${xp}* XP. ¿Quién será?`,
      `💔 Lloraste un poco por la noche, pero hoy te levantaste con fuerza. Toma *${ganancia.toLocaleString()}* kryons y *${xp}* XP para superar el desamor.`,
      `🍵 Mientras bebías tu té verde, encontraste un antiguo pergamino que te dio *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🍃 Una ráfaga de viento depositó *${ganancia.toLocaleString()}* kryons y *${xp}* XP directamente en tus manos.`,
      `💚 Midori-Hana te sonrió esta mañana y te bendijo con *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🥀 Te pinchaste con una rosa, pero tu esfuerzo se transformó en *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🦋 Una mariposa brillante se posó en tu hombro y te trajo *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `💍 Encontraste el anillo de compromiso que le devolvieron a tu amigo. Lo empeñaste por *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🐍 Una serpiente amistosa te guió hacia un botín escondido de *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🏕️ Acampaste bajo las estrellas y la luna te regaló *${ganancia.toLocaleString()}* kryons y *${xp}* XP al amanecer.`,
      `🥂 Brindaste por un nuevo comienzo y la vida te premió con *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🧪 Destilaste una poción perfecta esta madrugada. La vendiste y obtuviste *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🌧️ La lluvia limpió tus penas y dejó charcos brillantes que recogiste como *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🥰 Tuviste un sueño hermoso con esa persona especial y despertaste abrazando *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🌿 Arrancaste la maleza de tu corazón y en su lugar florecieron *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🦉 Un búho sabio te dejó una pequeña bolsa de tela con *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `💼 Firmaste la paz con tus enemigos. Como ofrenda te entregaron *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🔮 Miraste al cielo esmeralda y una lluvia de estrellas fugaces te concedió *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`
    ]

    const mensajeElegido = frases[Math.floor(Math.random() * frases.length)]
    const emojiContexto = mensajeElegido.split(' ')[0] 

    await sock.sendMessage(from, { react: { text: emojiContexto, key: msg.key } })
    await sock.sendMessage(from, { text: `> ${mensajeElegido}` }, { quoted: msg })
  }
}