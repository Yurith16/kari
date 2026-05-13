// plugins/divorcio.js

import { getUser, getRelation, setRelation, setNoviazgoFecha } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     'divorcio',
  tag:         'divorcio',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Termina tu matrimonio (seguirán siendo novios)',

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    const selfUser = getUser(selfNum)
    if (!selfUser) return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })

    const selfRel = getRelation(selfNum)
    if (!selfRel || selfRel.estado !== 'casado') {
      return sock.sendMessage(from, { text: '💍 No estás casado. Si quieres terminar tu noviazgo usa *.separar*.' }, { quoted: msg })
    }

    const parejaNum = selfRel.pareja
    const parejaPerfil = getUser(parejaNum)
    const parejaNombre = parejaPerfil?.nombre || parejaNum

    // Volver a novios, limpiar fecha de matrimonio
    setRelation(selfNum, 'en_relacion', parejaNum)
    setRelation(parejaNum, 'en_relacion', selfNum)

    const parejaJid = `${parejaNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      text: `💍 @${selfNum} y @${parejaNum} se divorciaron.\n\n🌸 El matrimonio terminó, pero el amor sigue. Ahora son novios otra vez, dándose una nueva oportunidad.`,
      mentions: [selfJid, parejaJid]
    }, { quoted: msg })
  }
}