// plugins/work.js
import { addKryons, addXp, isRegistered, checkCooldown, setCooldown, getInventory, removeItem } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 10 minutos (bájalo a 5 para tus pruebas si gustas)

export default {
  command:     ['work', 'trabajar', 'chamba', 'w'],
  tag:         'work',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Trabaja para ganar kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'work', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `> 🌿 *Hora de un respiro*\n> ↳ _Ya has trabajado suficiente por ahora. Vuelve en ${formatCooldown(cd.secsLeft)}._`
      }, { quoted: msg })
    }

    const baseGanancia = Math.floor(Math.random() * 300) + 300 
    let gananciaFinal = baseGanancia
    const xp = Math.floor(Math.random() * 15) + 8

    const inventario = getInventory(selfNum) || []
    const itemMaletin = inventario.find(i => i.item === 'maletín' && i.cantidad > 0)
    const tieneMaletin = !!itemMaletin

    if (tieneMaletin) {
      gananciaFinal = Math.floor(baseGanancia * 6.5)
      // Restamos 1 uso exacto de la base de datos
      removeItem(selfNum, 'maletín', 1)
    }

    addKryons(selfNum, gananciaFinal)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'work')

    const reacciones = ['💼', '🍃', '✨', '☕', '🌿', '📦', '🧬', '🐾', '🧹', '📜']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    const frases = [
      `Ayudaste en la cafetería local sirviendo mesas con entusiasmo.`,
      `Regaste con cuidado el majestuoso jardín botánico de Midori.`,
      `Hiciste un mandado sumamente importante y urgente para la alcaldía.`,
      `Atendiste de forma excelente a los clientes y lograste buenas propinas.`,
      `Trabajaste duro podando setos bajo el sol de la tarde.`,
      `Organizaste de arriba a abajo el almacén central de la comunidad.`,
      `Ayudaste a etiquetar muestras en el laboratorio botánico.`,
      `Cuidaste las traviesas mascotas del vecindario durante un par de horas.`,
      `Dejaste el área común del gremio completamente impecable.`,
      `Transcribiste pacientemente documentos antiguos y delicados.`
    ]

    const fraseElegida = frases[Math.floor(Math.random() * frases.length)]

    // Diseño limpio de caracteres idéntico al de minar
    let txt = `💼 ${fraseElegida}\n\n`
    txt += `> ✦ *Salario base:* ${baseGanancia.toLocaleString()} kryons\n`
    
    if (tieneMaletin) {
      const usosRestantes = itemMaletin.cantidad - 1
      if (usosRestantes > 0) {
        txt += `> ✦ *Multiplicador:* x6.5 (Maletín Activo 💼 - ${usosRestantes} usos disponibles)\n`
      } else {
        txt += `> ✦ *Multiplicador:* x6.5 (Maletín Activo 💼)\n`
      }
    } else {
      txt += `> ✦ *Multiplicador:* x1.0 (Ninguno)\n`
    }
    
    txt += `> ✦ *Ganancia Total:* *${gananciaFinal.toLocaleString()}* kryons\n`
    txt += `> ✦ *Experiencia:* +${xp} XP\n\n`

    if (tieneMaletin && itemMaletin.cantidad - 1 === 0) {
      txt += `⚠️ *¡Tu maletín de trabajo se ha desgastado por completo y se rompió!* Visita la *.tienda* para reponerlo.\n\n`
    }

    txt += `🌸 _¡Tu esfuerzo hace prosperar a Midori!_`

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}