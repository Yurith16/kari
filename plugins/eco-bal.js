// plugins/eco-balance.js
import { getUser, getEconomy } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { getRango } from '../settings/rangos.js'
import { toMono } from '../utils/helpers.js'

export default {
  command:     ['bal', 'balance', 'cartera', 'inv', 'inventario'],
  tag:         'balance',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra tu balance actual',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    const perfil = getUser(selfNum)
    const eco    = getEconomy(selfNum)
    const rango  = getRango(eco?.nivel || 1)
    const nombre = perfil?.nombre || selfNum
    const edad   = perfil?.edad   || null
    const total  = eco.kryons + eco.banco

    await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

    let txt = `> ╭─〔 ⚖️ *Balance* 〕\n`
    txt += `> │\n`
    txt += `> │ ✦ *Nombre* · ${nombre}\n`
    if (edad) txt += `> │ ✦ *Edad* · ${edad} años\n`
    txt += `> │ ✦ *Nivel* · ${eco.nivel}\n`
    txt += `> │ ✦ *Rango* · ${rango.emoji} ${rango.nombre}\n`
    txt += `> │ ✦ *Exp* · ${eco.xp.toLocaleString()} XP\n`
    txt += `> │\n`
    txt += `> │ ✦ *Kryons* · ${eco.kryons.toLocaleString()}\n`
    txt += `> │ ✦ *Banco* · ${eco.banco.toLocaleString()}\n`
    txt += `> │ ✦ *Total* · ${total.toLocaleString()}\n`
    txt += `> │\n`
    txt += `> ╰─── ${toMono(global.bot?.name || 'Midori-Hana')}`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}