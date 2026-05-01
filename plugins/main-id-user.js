export default {
  command: 'id',
  tag: 'id', 
  owner:   true,
  group:   false,

  async execute(sock, msg, { from, sender }) {
    try {
      const key    = msg.key
      const isGroup = from.endsWith('@g.us')

      let metaInfo = 'No es grupo'
      if (isGroup) {
        const meta        = await sock.groupMetadata(from)
        const participant = meta.participants.find(p => p.id === sender)
        metaInfo = participant
          ? `id: ${participant.id}\nphoneNumber: ${participant.phoneNumber || 'undefined'}\nadmin: ${participant.admin || false}`
          : `Participante no encontrado para sender: ${sender}`
      }

      const info = [
        `sender: ${sender}`,
        `key.participant: ${key.participant || 'undefined'}`,
        `key.remoteJid: ${key.remoteJid}`,
        `key.remoteJidAlt: ${key.remoteJidAlt || 'undefined'}`,
        `key.participantAlt: ${key.participantAlt || 'undefined'}`,
        `es @lid: ${sender?.endsWith('@lid')}`,
        ``,
        `── groupMetadata ──`,
        metaInfo
      ].join('\n')

      await sock.sendMessage(from, { text: `\`\`\`\n${info}\n\`\`\`` }, { quoted: msg })
    } catch (err) {
      await sock.sendMessage(from, { text: `Error: ${err.message}` }, { quoted: msg })
    }
  }
}