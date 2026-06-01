import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  generateWAMessageFromContent,
  generateWAMessage
} from '@whiskeysockets/baileys'
import pino from 'pino'
import fs   from 'fs'
import path from 'path'
import { parsePhoneNumber }  from 'awesome-phonenumber'
import { logger }            from '../utils/helpers.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { handleMessage }     from './pipeline.js'
import {
  getActiveSubbots,
  activarSubbot,
  desactivarSubbot,
  getSubbot,
  isGrupoActivoParaSubbot
} from './sqlite.js'

const SESIONES_DIR = path.join(process.cwd(), 'sesiones-sb')
if (!fs.existsSync(SESIONES_DIR)) fs.mkdirSync(SESIONES_DIR, { recursive: true })

// Mapa de instancias activas: numero → sock
export const subbotSocks = new Map()

function normalizeNumber(num) {
  const pn = parsePhoneNumber(String(num))
  return (pn.valid ? pn.number : num).replace(/\D/g, '')
}

// ─── Iniciar un subbot ────────────────────────────────────────────────────────

export async function startSubbot(numero, sockRaiz = null) {
  const numLimpio  = normalizeNumber(numero)
  const sesionDir  = path.join(SESIONES_DIR, numLimpio)
  const hasSession = fs.existsSync(path.join(sesionDir, 'creds.json'))

  if (!fs.existsSync(sesionDir)) fs.mkdirSync(sesionDir, { recursive: true })

  logger.info(`Subbot [${numLimpio}]`, hasSession
    ? 'Sesión encontrada, conectando...'
    : 'Sin sesión, solicitando código...')

  const { state, saveCreds } = await useMultiFileAuthState(sesionDir)
  const { version }          = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger:              pino({ level: 'silent' }),
    printQRInTerminal:   false,
    browser:             Browsers.ubuntu('Chrome'),
    auth:                state,
    syncFullHistory:     false,
    downloadHistory:     false,
    markOnlineOnConnect: true,
    getMessage:          async () => undefined
  })

  sock.generateWAMessageFromContent = generateWAMessageFromContent
  sock.generateWAMessage             = generateWAMessage

  // ─── Pairing code si no hay sesión ───────────────────────────────────────
  if (!hasSession) {
    await new Promise(r => setTimeout(r, 2000))
    try {
      const code           = await sock.requestPairingCode(numLimpio)
      const codeFormateado = code.match(/.{1,4}/g)?.join('-') || code
      logger.info(`Subbot [${numLimpio}]`, `Código: ${codeFormateado}`)

      // Enviar código al owner por privado
      if (sockRaiz) {
        const ownerNums = [global.bot?.ownerNumber].flat()
        for (const ownerNum of ownerNums) {
          const ownerJid = `${ownerNum.replace(/\D/g, '')}@s.whatsapp.net`
          await sockRaiz.sendMessage(ownerJid, {
            text: `🔑 *Código de emparejamiento*\n\n` +
                  `📱 Número: *${numLimpio}*\n` +
                  `🔐 Código: *${codeFormateado}*\n\n` +
                  `_Ingresa este código en WhatsApp > Dispositivos vinculados._`
          }).catch(() => {})
        }
      }
    } catch (err) {
      logger.error(`Subbot [${numLimpio}]`, `Error al pedir código: ${err.message}`)
    }
  }

  // ─── Eventos de conexión ─────────────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      if (code === DisconnectReason.loggedOut) {
        logger.error(`Subbot [${numLimpio}]`, 'Sesión cerrada.')
        subbotSocks.delete(numLimpio)
        desactivarSubbot(numLimpio)

        // Notificar al dueño (moderador = mismo número)
        if (sockRaiz) {
          const modJid = `${numLimpio}@s.whatsapp.net`
          await sockRaiz.sendMessage(modJid, {
            text: `⚠️ Tu subbot fue desconectado porque la sesión fue cerrada.\n\n_Contacta al owner para reconectarlo._`
          }).catch(() => {})
        }
        return
      }

      // Reconexión automática
      logger.warn(`Subbot [${numLimpio}]`, 'Desconectado, reconectando en 5s...')
      subbotSocks.delete(numLimpio)
      setTimeout(() => startSubbot(numLimpio, sockRaiz), 5000)
    }

    if (connection === 'open') {
      logger.info(`Subbot [${numLimpio}]`, `Conectado ✦ ${sock.user.id.split(':')[0]}`)
      subbotSocks.set(numLimpio, sock)
      activarSubbot(numLimpio)

      // Notificar al dueño que su subbot está activo
      if (sockRaiz) {
        const modJid = `${numLimpio}@s.whatsapp.net`
        await sockRaiz.sendMessage(modJid, {
          text: `🌿 Tu subbot está conectado y activo. ✦\n\n` +
                `Usa *.sbactivar* en el grupo donde quieras que responda.\n` +
                `Usa *.sbgrupos* para ver tus grupos activos.`
        }).catch(() => {})
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // ─── Mensajes ─────────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue

      const from = msg.key.remoteJid
      if (!from || from.includes('@broadcast') || from.includes('status')) continue

      const now = Date.now() / 1000
      if (now - (msg.messageTimestamp || 0) > 15) continue

      // Resolver número real del remitente
      const sender   = msg.key.participant || from
      let   realJid  = sender
      try { realJid  = await getRealJid(sock, sender, msg) } catch {}
      const userNum  = cleanNumber(realJid)

      // ── Filtro de chats permitidos ────────────────────────────────────────
      const isGroup    = from.endsWith('@g.us')
      const isPrivado  = !isGroup
      const esModerador = userNum === numLimpio

      if (!esModerador) {
        // En privado: solo responde al moderador
        if (isPrivado) continue

        // En grupo: solo si el grupo está activo para este subbot
        if (isGroup && !isGrupoActivoParaSubbot(numLimpio, from)) continue
      }

      if (global.features?.autoRead && !msg.key.fromMe) {
        sock.readMessages([msg.key]).catch(() => {})
      }

      handleMessage(sock, msg).catch(() => {})
    }
  })

  return sock
}

// ─── Detener un subbot ────────────────────────────────────────────────────────

export async function stopSubbot(numero) {
  const numLimpio = normalizeNumber(numero)
  const sock      = subbotSocks.get(numLimpio)
  if (sock) {
    try { await sock.logout() } catch {}
    try { await sock.end()    } catch {}
    subbotSocks.delete(numLimpio)
  }
  desactivarSubbot(numLimpio)
  logger.info(`Subbot [${numLimpio}]`, 'Detenido')
}

// ─── Eliminar sesión ──────────────────────────────────────────────────────────

export function deleteSubbotSession(numero) {
  const numLimpio = normalizeNumber(numero)
  const sesionDir = path.join(SESIONES_DIR, numLimpio)
  if (fs.existsSync(sesionDir)) {
    fs.rmSync(sesionDir, { recursive: true, force: true })
    logger.info(`Subbot [${numLimpio}]`, 'Sesión eliminada')
  }
}

// ─── Arrancar todos los subbots activos al iniciar el raíz ───────────────────

export async function startAllSubbots(sockRaiz) {
  const activos = getActiveSubbots()
  if (activos.length === 0) return
  logger.info('Subbots', `Iniciando ${activos.length} subbot(s) activo(s)...`)
  for (const sb of activos) {
    await startSubbot(sb.numero, sockRaiz).catch(err => {
      logger.error(`Subbot [${sb.numero}]`, `Error al iniciar: ${err.message}`)
    })
    await new Promise(r => setTimeout(r, 3000))
  }
}