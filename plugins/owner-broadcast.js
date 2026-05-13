export default {
  command:   'broadcast',
  tag:       'broadcast',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un mensaje a todos los grupos',

  async execute(sock, msg, { from, args }) {
    const texto = args.join(' ')
    if (!texto) {
      await sock.sendMessage(from, { text: global.messages.broadcastEmpty }, { quoted: msg })
      return
    }
    try {
      const groups = await sock.groupFetchAllParticipating()
      const ids    = Object.keys(groups)
      let sent     = 0

      for (const id of ids) {
        try {
          // Obtener miembros del grupo para etiquetar
          let mentions = []
          try {
            const meta = await sock.groupMetadata(id)
            mentions = meta.participants.map(p => p.id)
          } catch {}

          await sock.sendMessage(id, { text: texto, mentions })
          sent++
          await new Promise(r => setTimeout(r, 1200))
        } catch {}
      }

      await sock.sendMessage(from, {
        text: global.messages.broadcastSent.replace('{count}', sent)
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}