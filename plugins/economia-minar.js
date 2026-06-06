// plugins/minar.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown, getInventory, removeItem } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 5 segundos para pruebas

export default {
  command:     ['minar', 'mine', 'minero'],
  tag:         'minar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Mina para conseguir kryons y experiencia',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'minar', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌿 Tus herramientas necesitan enfriarse. Espera *${formatCooldown(cd.secsLeft)}* para volver a la mina.`
      }, { quoted: msg })
    }

    const baseGanancia = Math.floor(Math.random() * 300) + 300
    let gananciaFinal = baseGanancia
    const xp = Math.floor(Math.random() * 15) + 8

    const inventario = getInventory(selfNum) || []
    // Buscamos si el usuario tiene picos disponibles en su inventario
    const itemPico = inventario.find(i => i.item === 'pico' && i.cantidad > 0)
    const tienePico = !!itemPico

    if (tienePico) {
      gananciaFinal = Math.floor(baseGanancia * 8.0)
      // Restamos 1 de la cantidad (que representa un uso consumido)
      removeItem(selfNum, 'pico', 1)
    }

    addKryons(selfNum, gananciaFinal)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'minar')

    const reacciones = ['⛏️', '💎', '🪨', '✨', '🍀', '🌿']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    const frases = [
      `⛏️ Picaste piedra hasta el cansancio en las profundidades de la cueva.`,
      `💎 En lo profundo de la montaña, encontraste un cristal sumamente valioso.`,
      `🪨 Entre el polvo y la tierra pesada, lograste extraer material valioso.`,
      `✨ Brillaba intensamente en la oscuridad: era un depósito olvidado esperándote.`,
      `🍀 Tuviste muchísima suerte hoy; al primer golpe de tu herramienta, cedió la roca.`,
      `🌿 El espeso bosque de Midori ocultaba esta mina secreta lista para ser explotada.`,
      `⚙️ Aunque tus herramientas están desgastadas, valió totalmente la pena el esfuerzo.`,
      `🔨 Golpe a golpe, el muro de piedra cedió por completo y te recompensó.`,
      `🏮 Iluminaste un pasadizo antiguo y recuperaste restos de una civilización rica.`,
      `🌑 El pesado trabajo nocturno en los túneles subterráneos rindió sus frutos.`,
      `🧪 Mezclaste de forma inteligente los minerales encontrados para aumentar su valor.`,
      `🎒 Llenaste por completo tu mochila de expedición con rocas brillantes.`,
      `🦅 Un águila soltó una gema extraña sobre la entrada de la cueva justo a tu llegada.`,
      `💧 Encontraste una hermosa veta subterránea que filtraba minerales puros.`,
      `🧤 Tus manos están sucias, pero tu cuenta bancaria es más feliz con *${gananciaFinal.toLocaleString()}* kryons.`,
      `🧱 Has removido bloques pesados y peligrosos abriendo un nuevo camino.`,
      `📈 La demanda global de metales subió justo cuando vendiste tus hallazgos.`,
      `🍄 Encontraste hongos exóticos sumamente caros junto a las vetas principales.`,
      `🗝️ Usaste una llave oxidada en un viejo cofre minero enterrado en la pared.`,
      `🔥 El calor de la mina es intenso, pero el botín refresca por completo tu espíritu.`
    ]

    const fraseElegida = frases[Math.floor(Math.random() * frases.length)]

    let txt = `⛏️ ${fraseElegida}\n\n`
    txt += `> ✦ *Minerales base:* ${baseGanancia.toLocaleString()} kryons\n`
    
    if (tienePico) {
      // Como ya restamos 1 arriba, itemPico.cantidad - 1 nos dice con exactitud cuántos usos netos le quedan
      const usosRestantes = itemPico.cantidad - 1
      if (usosRestantes > 0) {
        txt += `> ✦ *Multiplicador:* x8.0 (Pico Premium ⛏️ - ${usosRestantes} usos disponibles)\n`
      } else {
        txt += `> ✦ *Multiplicador:* x8.0 (Pico Premium ⛏️)\n`
      }
    } else {
      txt += `> ✦ *Multiplicador:* x1.0 (Ninguno)\n`
    }
    
    txt += `> ✦ *Ganancia Total:* *${gananciaFinal.toLocaleString()}* kryons\n`
    txt += `> ✦ *Experiencia:* +${xp} XP\n\n`

    // Alerta dramática si se quedó en 0 absoluto
    if (tienePico && itemPico.cantidad - 1 === 0) {
      txt += `⚠️ *¡Tus picos premium se han roto por completo!* Ya no te quedan usos acumulados. Visita la *.tienda*.\n\n`
    }

    txt += `🌸 _¡Sigue explotando los recursos de Midori!_`

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}