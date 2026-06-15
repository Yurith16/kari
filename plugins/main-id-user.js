// plugins/id.js
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command: 'id',
  tag: 'id',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Muestra tu información de identificación',

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)
    const key = msg.key
    const isGroup = from.endsWith('@g.us')

    let txt = `> 🆔 *INFORMACIÓN*\n> \n`
    txt += `> ✦ *Número:* ${selfNum}\n`
    txt += `> ✦ *Sender:* ${sender}\n`
    txt += `> ✦ *Es @lid:* ${sender?.endsWith('@lid') ? 'Sí' : 'No'}\n`
    txt += `> \n`
    txt += `> 🔑 *KEY*\n> \n`
    txt += `> ✦ *Participant:* ${key.participant || 'No disponible'}\n`
    txt += `> ✦ *RemoteJid:* ${key.remoteJid}\n`
    txt += `> ✦ *RemoteJidAlt:* ${key.remoteJidAlt || 'No disponible'}\n`
    txt += `> ✦ *ParticipantAlt:* ${key.participantAlt || 'No disponible'}\n`

    if (isGroup) {
      const meta = await sock.groupMetadata(from).catch(() => null)
      if (meta) {
        const participant = meta.participants.find(p => p.id === sender || p.id === selfJid)
        txt += `> \n`
        txt += `> 👥 *GRUPO*\n> \n`
        txt += `> ✦ *ID:* ${participant?.id || 'No encontrado'}\n`
        txt += `> ✦ *Teléfono:* ${participant?.phoneNumber || 'No disponible'}\n`
        txt += `> ✦ *Admin:* ${participant?.admin ? 'Sí' : 'No'}\n`
      }
    }

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}