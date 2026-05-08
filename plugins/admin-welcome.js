import { setGroupField } from '../core/sqlite.js'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const IMG_DIR = resolve('media/welcome')
if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true })

export default {
  command:     'welcome',
  tag:         'welcome',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Activa/Desactiva y configura la bienvenida del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg, prefix }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const hasImage = msg.message?.imageMessage ||
                     msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

    // ─── Configurar imagen ────────────────────────────────────────────────────
    if (hasImage) {
      try {
        const sourceMsg = msg.message?.imageMessage
          ? msg
          : { message: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage }
        const buffer  = await downloadMediaMessage(sourceMsg, 'buffer', {})
        const imgPath = join(IMG_DIR, `${from.replace(/[^a-z0-9]/gi, '_')}.jpg`)
        writeFileSync(imgPath, buffer)
        setGroupField(from, 'welcomeImg', `file://${imgPath}`)
        // Si hay caption en la imagen, también actualizar texto
        const caption = msg.message?.imageMessage?.caption || ''
        if (caption) {
          const texto = caption.replace(/^[^\s]+\s*/, '').trim()
          if (texto) setGroupField(from, 'welcomeText', texto)
        }
        await sock.sendMessage(from, {
          text: '✅ Imagen de bienvenida actualizada.\n\n✦ Envía *.welcome <texto>* para cambiar el mensaje.'
        }, { quoted: msg })
      } catch {
        await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
      }
      return
    }

    // ─── Configurar por URL ───────────────────────────────────────────────────
    const cmdLine   = fullText.split('\n')[0]
    const firstLine = cmdLine.replace(/^[^\s]+\s*/, '')
    const resto     = fullText.split('\n').slice(1).join('\n')
    const texto     = (firstLine + (resto ? '\n' + resto : '')).trim()

    // Si el texto es una URL de imagen
    if (texto && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(texto)) {
      setGroupField(from, 'welcomeImg', texto)
      await sock.sendMessage(from, {
        text: `✅ Imagen de bienvenida actualizada con URL.`
      }, { quoted: msg })
      return
    }

    // ─── Configurar texto ─────────────────────────────────────────────────────
    if (texto) {
      setGroupField(from, 'welcomeText', texto)
      await sock.sendMessage(from, {
        text: `👋 Mensaje de bienvenida actualizado:\n\n${texto}`
      }, { quoted: msg })
      return
    }

    // ─── Toggle on/off ────────────────────────────────────────────────────────
    const estado = groupCfg?.welcomeMsg
    setGroupField(from, 'welcomeMsg', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.welcomeOff : global.messages.welcomeOn
    }, { quoted: msg })
  }
}