// plugins/comprar.js
import { getEconomy, removeKryons, getItemTienda, addItem, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['comprar', 'buy'],
  tag:         'comprar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Compra un artículo premium de la tienda',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/ +/).slice(1)

    if (args.length === 0) {
      return sock.sendMessage(from, { text: '🌸 ¿Qué deseas adquirir? Uso: *.comprar [nombre]*' }, { quoted: msg })
    }

    const itemName = args[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    
    let itemBuscar = itemName
    if (itemName === 'maletin') itemBuscar = 'maletín'

    const item = getItemTienda(itemBuscar)

    if (!item) {
      return sock.sendMessage(from, { text: '🌸 Ese artículo no existe. Revisa la *.tienda*.' }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)
    if (eco.kryons < item.precio) {
      const faltante = item.precio - eco.kryons
      return sock.sendMessage(from, { text: `🌸 Fondos insuficientes. Te faltan *${faltante.toLocaleString()}* kryons para el objeto *${item.item}*.` }, { quoted: msg })
    }

    removeKryons(selfNum, item.precio)

    // Si compra un pico o maletín, le damos 3 usos (unidades) de golpe gracias al ajuste de base de datos
    const cantidadAñadir = (itemBuscar === 'pico' || itemBuscar === 'maletín') ? 3 : 1
    addItem(selfNum, itemBuscar, cantidadAñadir)

    await sock.sendMessage(from, { react: { text: '💳', key: msg.key } })

    let txt = `> ╭─〔 🛍️ *COMPRA EXITOSA* 〕\n`
    txt += `> │\n`
    txt += `> │ ✦ *Adquirido:* ${item.emoji} *${item.item.toUpperCase()}*\n`
    txt += `> │ ✦ *Costo:* ${item.precio.toLocaleString()} kryons\n`
    txt += `> │ ✦ *Estado:* Agregado a tu mochila con éxito\n`
    
    if (itemBuscar === 'pico' || itemBuscar === 'maletín') {
      txt += `> │ ✦ *Ventaja:* +3 usos premium añadidos de forma efectiva\n`
    }
    
    txt += `> │\n`
    txt += `> ╰─── 🌸 _¡Disfruta tus nuevas ventajas premium!_`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}