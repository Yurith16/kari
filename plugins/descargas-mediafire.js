export default {
  command:   ['mediafire', 'mf'],
  tag:       'mediafire',
  categoria: 'descargas',
  owner:     false,
  group:     false,

  async execute(sock, msg, { from, args }) {
    const url = args[0]

    if (!url || !url.includes('mediafire.com')) {
      await sock.sendMessage(from, {
        text: '✦ Ingresa una URL de MediaFire.\n\nEjemplo: *.mf https://www.mediafire.com/file/xxx*'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    try {
      const res = await fetch('https://panel.apinexus.fun/api/mediafire/v2/descargar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'antbx21e5jhac' },
        body:    JSON.stringify({ url })
      })
      const json = await res.json()

      if (!json.success || !json.data) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: global.messages?.error || '✦ No se pudo obtener el archivo.' }, { quoted: msg })
        return
      }

      const { filename, download, filesize, ext } = json.data
      const sizeNumber = parseFloat(filesize)

      if (sizeNumber > 600) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '✦ El archivo pesa más de 600MB.' }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const fileRes = await fetch(download)
      const fileBuffer = Buffer.from(await fileRes.arrayBuffer())

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      await sock.sendMessage(from, {
        document: fileBuffer,
        mimetype: ext === 'apk' ? 'application/vnd.android.package-archive' : 'application/octet-stream',
        fileName: filename
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages?.error || '✦ Error al procesar la descarga.' }, { quoted: msg })
    }
  }
}