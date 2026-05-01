export default {
  command:   'xnxxs',
  tag:       'xnxxs',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, {
        text: '✦ Ingresa el título a buscar.\n\nEjemplo: *.xnxx latina*'
      }, { quoted: msg })
      return
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔥', key: msg.key } })

      const query = args.join(' ')
      const res   = await fetch('https://panel.apinexus.fun/api/xnxx/buscar', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key':    'antbx21e5jhac'
        },
        body: JSON.stringify({ query, page: 0 })
      })

      const json = await res.json()

      if (!json.success || !json.results?.length) {
        await sock.sendMessage(from, {
          text: '✦ No se encontraron resultados para esa búsqueda.'
        }, { quoted: msg })
        return
      }

      // Tomar 5 resultados aleatorios sin repetir
      const shuffled = json.results.sort(() => Math.random() - 0.5).slice(0, 5)

      for (const video of shuffled) {
        const caption = `🔞 *${video.title}*\n` +
          `✦ Duración: ${video.duration}\n` +
          `✦ Vistas: ${video.views}\n` +
          `✦ ${video.url}`
        try {
          const imgRes = await fetch(video.thumbnail)
          if (!imgRes.ok) throw new Error('sin imagen')
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
          await sock.sendMessage(from, { image: imgBuffer, caption }, { quoted: msg })
        } catch {
          await sock.sendMessage(from, { text: caption }, { quoted: msg })
        }
      }

    } catch {
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}