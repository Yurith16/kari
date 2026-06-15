// plugins/separar.js
import { getUser, getRelation, breakRelation } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command: 'separar',
  tag: 'separar',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Termina tu relación de noviazgo',

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    const selfUser = getUser(selfNum)
    if (!selfUser) return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })

    const selfRel = getRelation(selfNum)
    if (!selfRel || selfRel.estado === 'soltero') {
      return sock.sendMessage(from, { text: '🌸 No estás en una relación.' }, { quoted: msg })
    }

    if (selfRel.estado === 'casado') {
      return sock.sendMessage(from, { text: '💍 Estás casado. Si quieres terminar el matrimonio usa *.divorcio*.' }, { quoted: msg })
    }

    const parejaNum = selfRel.pareja
    const parejaPerfil = getUser(parejaNum)
    const parejaNombre = parejaPerfil?.nombre || parejaNum
    const parejaJid = `${parejaNum}@s.whatsapp.net`

    breakRelation(selfNum)

    await sock.sendMessage(from, {
      text: `💔 @${selfNum} y @${parejaNombre} ya no son novios. A veces el amor toma caminos distintos, pero el jardín sigue floreciendo.`,
      mentions: [selfJid, parejaJid]
    }, { quoted: msg })
  }
}