// plugins/delsession.js
import path from 'path'
import fs   from 'fs'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { getSubbot, deleteSubbot } from '../core/sqlite.js'
import { stopSubbot, deleteSubbotSession, subbotSocks } from '../core/subbot-manager.js'

const SESIONES_DIR = path.join(process.cwd(), 'sesiones-sb')

export default {
  command: 'delsession',
  tag: 'delsession',
  categoria: 'owner',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Elimina tu sesión de subbot',

  async execute(sock, msg, { from, sender }) {
    const realJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const userNum  = cleanNumber(realJid)
    const sesionDir = path.join(SESIONES_DIR, userNum)

    // Verificar que tiene sesión guardada
    if (!fs.existsSync(path.join(sesionDir, 'creds.json'))) {
      await sock.sendMessage(from, {
        text: '🌿 No tienes ninguna sesión de subbot guardada.'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, {
      text: '⏳ Eliminando tu sesión...'
    }, { quoted: msg })

    // Detener instancia si está activa
    if (subbotSocks.has(userNum)) {
      await stopSubbot(userNum).catch(() => {})
    }

    // Borrar sesión del disco
    deleteSubbotSession(userNum)

    // Borrar de la DB
    const registro = getSubbot(userNum)
    if (registro) deleteSubbot(userNum)

    await sock.sendMessage(from, {
      text: `✅ Tu sesión de subbot *${userNum}* fue eliminada correctamente.\n\n_Si quieres volver a conectarte, pídele al owner un nuevo código._`
    }, { quoted: msg })
  }
}