import fs from 'fs'
import path from 'path'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { setUserField, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const PERFILES_DIR = path.join(process.cwd(), 'base', 'perfiles')
if (!fs.existsSync(PERFILES_DIR)) fs.mkdirSync(PERFILES_DIR, { recursive: true })

export default {
    command: 'pfoto',
    tag: 'pfoto',
    categoria: 'main',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: '🌸 Establece tu foto de perfil',

    async execute(sock, msg, { from, sender }) {
        const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
        const selfNum = cleanNumber(selfJid)

        if (!isRegistered(selfNum)) {
            return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const messageToDownload = quoted || msg.message

        const ALLOWED_TYPES = ['imageMessage', 'stickerMessage', 'videoMessage', 'gifMessage']
        const mediaType = Object.keys(messageToDownload || {}).find(k => ALLOWED_TYPES.includes(k))

        if (!mediaType) {
            return sock.sendMessage(from, {
                text: '🌸 Responde a una imagen, gif o video corto con *.pfoto*'
            }, { quoted: msg })
        }

        // Validar duración si es video
        if (mediaType === 'videoMessage') {
            const seconds = messageToDownload[mediaType]?.seconds || 0
            if (seconds > 15) {
                return sock.sendMessage(from, {
                    text: '🌸 El video no puede durar más de 15 segundos.'
                }, { quoted: msg })
            }
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

        try {
            const buffer = await downloadMediaMessage(
                { message: messageToDownload },
                'buffer',
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            )

            if (!buffer) throw new Error('Buffer vacío')

            const mime = messageToDownload[mediaType]?.mimetype || 'image/jpeg'

            let ext = '.jpg'
            if (mime.includes('png'))  ext = '.png'
            if (mime.includes('gif'))  ext = '.gif'
            if (mime.includes('webp')) ext = '.webp'
            if (mime.includes('mp4') || mime.includes('video')) ext = '.mp4'

            // Borrar foto anterior del usuario si existe
            for (const file of fs.readdirSync(PERFILES_DIR)) {
                if (file.startsWith(`${selfNum}.`)) {
                    fs.unlinkSync(path.join(PERFILES_DIR, file))
                }
            }

            const fileName = `${selfNum}${ext}`
            const filePath = path.join(PERFILES_DIR, fileName)

            fs.writeFileSync(filePath, buffer)
            setUserField(selfNum, 'foto', filePath)

            await sock.sendMessage(from, {
                text: '🌸 *Foto de perfil actualizada*'
            }, { quoted: msg })

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

        } catch (err) {
            console.error('[PFOTO] Error:', err.message)
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
            await sock.sendMessage(from, {
                text: '🌿 No pude procesar tu foto.'
            }, { quoted: msg })
        }
    }
}