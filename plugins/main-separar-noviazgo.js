// plugins/separar.js

import { getUser, getRelation, breakRelation } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     'separar',
  tag:         'separar',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Termina tu relación/noviazgo actual',

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    const selfUser = getUser(selfNum)
    if (!selfUser) return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })

    const selfRel = getRelation(selfNum)
    if (!selfRel || selfRel.estado === 'soltero') {
      return sock.sendMessage(from, { text: '🌸 No estás en una relación, no tienes de quién separarte.' }, { quoted: msg })
    }

    if (selfRel.estado === 'casado') {
      return sock.sendMessage(from, { text: '💍 Estás casado, si quieres terminar el matrimonio usa *.divorcio*. Si luego quieres separarte como novios, podrás hacerlo.' }, { quoted: msg })
    }

    const parejaNum = selfRel.pareja
    const parejaPerfil = getUser(parejaNum)
    const parejaNombre = parejaPerfil?.nombre || parejaNum

    breakRelation(selfNum)

    const parejaJid = `${parejaNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      text: `💔 @${selfNum} y @${parejaNum} ya no son novios.\n\n🌸 A veces el amor toma caminos distintos. Cada quien por su lado, pero con el corazón en paz.`,
      mentions: [selfJid, parejaJid]
    }, { quoted: msg })
  }
}