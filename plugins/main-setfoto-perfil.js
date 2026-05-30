// plugins/pfoto.js
import fs from 'fs'
import path from 'path'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import fetch, { FormData, Blob } from 'node-fetch'
import { setUserField, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const TEMP_DIR = path.join(process.cwd(), 'tmp')
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

async function uploadToMp3Tourl(buffer, mimeType, fileName) {
    const form = new FormData()
    form.append('file', new Blob([buffer], { type: mimeType }), fileName)

    const res = await fetch('https://www.mp3tourl.com/api/upload', {
        method: 'POST',
        body: form,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
            'Accept': '*/*',
            'Referer': 'https://www.mp3tourl.com/tools/photo-to-url',
            'Origin': 'https://www.mp3tourl.com'
        }
    })

    const data = await res.json()
    console.log('[PFOTO] Respuesta mp3tourl:', JSON.stringify(data, null, 2))
    
    if (data.success && data.url) {
        return data.url
    }
    throw new Error('No se pudo subir la imagen: ' + JSON.stringify(data))
}

export default {
    command: 'pfoto',
    tag: 'pfoto',
    categoria: 'main',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: '🌸 Establece tu foto de perfil',

    async execute(sock, msg, { from, args, sender }) {
        const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
        const selfNum = cleanNumber(selfJid)

        if (!isRegistered(selfNum)) {
            return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
        }

        const urlArg = args[0]
        if (urlArg && (urlArg.startsWith('http://') || urlArg.startsWith('https://'))) {
            setUserField(selfNum, 'foto', urlArg)
            await sock.sendMessage(from, {
                image: { url: urlArg },
                caption: `🌸 ¡Foto actualizada!`
            }, { quoted: msg })
            return
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const messageToDownload = quoted ? quoted : msg.message

        const mediaType = Object.keys(messageToDownload || {}).find(key => 
            key.includes('Message') && !key.includes('protocol') && 
            /image|sticker/g.test(key)
        )

        if (!mediaType) {
            return sock.sendMessage(from, { 
                text: '🌸 Responde a una imagen con .pfoto\n\nO usa: .pfoto https://tuenlace.com' 
            }, { quoted: msg })
        }

        if (mediaType.includes('video')) {
            return sock.sendMessage(from, { 
                text: '🌸 Solo se permiten imágenes, no videos.' 
            }, { quoted: msg })
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

        try {
            const buffer = await downloadMediaMessage(
                { message: messageToDownload },
                'buffer',
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            )

            if (!buffer) throw new Error('Error al descargar')

            const mime = messageToDownload[mediaType]?.mimetype || 'image/jpeg'
            
            let ext = '.jpg'
            if (mime.includes('png')) ext = '.png'
            else if (mime.includes('gif')) ext = '.gif'
            else if (mime.includes('webp')) ext = '.webp'

            const fileName = `pfoto_${selfNum}_${Date.now()}${ext}`

            const imageUrl = await uploadToMp3Tourl(buffer, mime, fileName)

            setUserField(selfNum, 'foto', imageUrl)

            const imgRes = await fetch(imageUrl)
            const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

            await sock.sendMessage(from, {
                image: imgBuffer,
                caption: `🌸 *Foto de perfil actualizada*\n\n🔗 ${imageUrl}`
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