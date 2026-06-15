// plugins/divorcio.js
import { getUser, getRelation, setRelation } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command: 'divorcio',
  tag: 'divorcio',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Termina tu matrimonio y vuelven a ser novios',

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    const selfUser = getUser(selfNum)
    if (!selfUser) return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })

    const selfRel = getRelation(selfNum)
    if (!selfRel || selfRel.estado !== 'casado') {
      return sock.sendMessage(from, { text: '> 🩷 No estás casado. Si quieres terminar tu noviazgo usa *.separar*.' }, { quoted: msg })
    }

    const parejaNum = selfRel.pareja
    const parejaPerfil = getUser(parejaNum)
    const parejaNombre = parejaPerfil?.nombre || parejaNum

    setRelation(selfNum, 'en_relacion', parejaNum)
    setRelation(parejaNum, 'en_relacion', selfNum)

    const parejaJid = `${parejaNum}@s.whatsapp.net`

    await sock.sendMessage(from, {
      text: `💍 @${selfNum} y @${parejaNum} se divorciaron. El matrimonio terminó pero siguen siendo novios, el amor no se fue del todo.`,
      mentions: [selfJid, parejaJid]
    }, { quoted: msg })
  }
}