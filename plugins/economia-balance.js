// plugins/eco-balance.js
import { getEconomy, getUser, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

export default {
  command: ['bal', 'balance', 'cartera', 'inv', 'inventario'],
  tag: 'balance',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Muestra tu balance y nivel actual',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const perfil = getUser(selfNum)
    const eco = getEconomy(selfNum)
    const nombre = perfil.apodo || perfil.nombre
    const total = eco.kryons + eco.banco

    let txt = `> ╭─〔 🌸 *BALANCE* 〕\n`
    txt += `> │\n`
    txt += `> │ ✦ *Usuario:* ${nombre}\n`
    txt += `> │ ✦ *Nivel:* ${eco.nivel}\n`
    txt += `> │ ✦ *Exp:* ${eco.xp?.toLocaleString() || 0} XP\n`
    txt += `> │ ✦ *Kryons:* ${eco.kryons.toLocaleString()}\n`
    txt += `> │ ✦ *Banco:* ${eco.banco.toLocaleString()}\n`
    txt += `> │ ✦ *Total:* ${total.toLocaleString()}\n`
    txt += `> │\n`
    txt += `> ╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}