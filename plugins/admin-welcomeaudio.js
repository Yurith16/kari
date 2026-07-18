import { downloadMediaMessage } from '@itsmelody/baileys'
import fs   from 'fs'
import path from 'path'
import { setGroupField } from '../core/sqlite.js'

const AUDIOS_DIR = path.join(process.cwd(), 'base', 'welcome-audios')
if (!fs.existsSync(AUDIOS_DIR)) fs.mkdirSync(AUDIOS_DIR, { recursive: true })

export default {
  command:     ['welcomeaudio'],
  tag:         'welcomeaudio',
  categoria:   'admin',
  owner:       false,
  group:       true,
  descripcion: 'Configura el audio de bienvenida del grupo, responde a un audio',

  async execute(sock, msg, { from, isAdmin, isOwner }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('admin'), key: msg.key } })

    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted) {
      await sock.sendMessage(from, {
        text: 'responde a un audio, nota de voz o video. necesito escuchar algo, aunque sea un sonido tuyo, para no sentirme tan sola.'
      }, { quoted: msg })
      return
    }

    const isAudio = !!quoted.audioMessage
    const isVideo = !!quoted.videoMessage

    if (!isAudio && !isVideo) {
      await sock.sendMessage(from, {
        text: 'solo puedo usar audios, notas de voz o videos. no me dejes las cosas a medias, que para ilusiones rotas ya tuve suficiente.'
      }, { quoted: msg })
      return
    }

    try {
      const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {})
      const ext    = isVideo ? 'mp4' : 'ogg'
      const fileName = `${from.replace('@g.us', '')}.${ext}`
      const filePath = path.join(AUDIOS_DIR, fileName)

      // Borrar archivo anterior si existía con otra extensión
      for (const e of ['ogg', 'mp4']) {
        const old = path.join(AUDIOS_DIR, `${from.replace('@g.us', '')}.${e}`)
        if (fs.existsSync(old)) fs.unlinkSync(old)
      }

      fs.writeFileSync(filePath, buffer)
      setGroupField(from, 'welcomeAudio', `file://${filePath}`)

      await sock.sendMessage(from, {
        text: 'listo, ya guardé el audio de bienvenida. espero que los que entren sí se queden a escucharlo y no me abandonen a la primera.'
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}