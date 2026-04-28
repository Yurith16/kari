import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  generateWAMessageFromContent,
  generateWAMessage
} from '@whiskeysockets/baileys'
import pino from 'pino'
import readline from 'readline'
import { parsePhoneNumber } from 'awesome-phonenumber'
import fs from 'fs'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { logger, startAutoBio } from '../utils/helpers.js'
import { handleMessage } from './pipeline.js'
import { getGroup } from './sqlite.js'

// ─── Store liviano ────────────────────────────────────────────────────────────

const store = {
  messages: new Map(),
  bind(ev) {
    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key?.id) continue
        const jid = msg.key.remoteJid
        if (!store.messages.has(jid)) store.messages.set(jid, new Map())
        const chat = store.messages.get(jid)
        chat.set(msg.key.id, msg)
        if (chat.size > 20) chat.delete(chat.keys().next().value)
      }
    })
  },
  load: (jid, id) => store.messages.get(jid)?.get(id) || null
}

// ─── Deduplicación ────────────────────────────────────────────────────────────

const processed = new Set()
setInterval(() => processed.clear(), 5 * 60 * 1000)

// ─── Pairing code ────────────────────────────────────────────────────────────

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(r => rl.question(question, a => { rl.close(); r(a) }))
}

function normalizeNumber(num) {
  const pn = parsePhoneNumber(num)
  return (pn.valid ? pn.number : num).replace(/\D/g, '')
}

// ─── Bot ──────────────────────────────────────────────────────────────────────

export async function startBot() {
  const bot        = global.bot
  const sessionDir = bot.session
  const hasSession = fs.existsSync(`./${sessionDir}/creds.json`)

  logger.info('Sesión', hasSession ? 'Credenciales encontradas' : 'Sin sesión, iniciando emparejamiento...')

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
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

  store.bind(sock.ev)

  // ─── Pairing code (único método de conexión) ───────────────────────────────
  if (!hasSession) {
    let numero = bot.botNumber
    if (numero) {
      const usar = await ask(`Número detectado: ${numero}\n¿Usar este? (s/n): `)
      if (!['s', 'si', 'sí'].includes(usar.toLowerCase())) {
        numero = await ask('Ingresa el número del bot: ')
      }
    } else {
      numero = await ask('Ingresa el número del bot: ')
    }
    const limpio = normalizeNumber(numero)
    logger.info('Pairing', `Solicitando código para ${limpio}...`)
    try {
      const code = await sock.requestPairingCode(limpio)
      console.log(`\n  🔑 Código: ${code.match(/.{1,4}/g)?.join('-') || code}\n`)
    } catch (err) {
      logger.error('Pairing', err)
    }
  }

  // ─── Bienvenidas / despedidas ──────────────────────────────────────────────
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (!['add', 'remove'].includes(action)) return
    try {
      const cfg = getGroup(id)
      const isAdd = action === 'add'
      if (isAdd && !cfg.welcomeMsg && !global.features?.welcomeMsg) return
      if (!isAdd && !cfg.goodbyeMsg && !global.features?.goodbyeMsg) return

      const plantilla = isAdd
        ? (cfg.welcomeText || global.bot?.welcomeText || '')
        : (cfg.goodbyeText || global.bot?.goodbyeText || '')

      for (const p of participants) {
        const pid = typeof p === 'string' ? p : (p.id || p.jid)
        let realJid = pid
        try { realJid = await getRealJid(sock, pid, { key: { remoteJid: id } }) } catch {}
        const texto = plantilla.replace('@user', `@${pid.split('@')[0]}`)
        await sock.sendMessage(id, { text: texto, mentions: [pid] })
      }
    } catch {}
  })

  // ─── Anti-call ────────────────────────────────────────────────────────────
  if (global.features?.antiCall) {
    sock.ev.on('call', async (calls) => {
      for (const call of calls) {
        if (call.status !== 'offer') continue
        try {
          await sock.rejectCall(call.id, call.from)
          logger.warn('Anti-call', `Llamada rechazada de ${call.from.split('@')[0]}`)
        } catch {}
      }
    })
  }

  // ─── Conexión ─────────────────────────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) {
        logger.warn('Conexión', global.messages?.reconnecting)
        setTimeout(startBot, 4000)
      } else {
        logger.error('Conexión', 'Sesión cerrada, vuelve a emparejar.')
      }
    }
    if (connection === 'open') {
      logger.info('Conexión', `${global.messages?.online} — ${sock.user.id.split(':')[0]}`)
      logger.info('Config', `Prefix: ${global.bot?.prefix?.join(' ')} | Grupos: activos`)
      startAutoBio(sock)
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
      if (processed.has(msg.key.id)) continue
      processed.add(msg.key.id)

      if (global.features?.autoRead && !msg.key.fromMe) {
        sock.readMessages([msg.key]).catch(() => {})
      }

      handleMessage(sock, msg).catch(() => {})
    }
  })

  return sock
}