import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  generateWAMessageFromContent,
  generateWAMessage
} from '@whiskeysockets/baileys'
import pino     from 'pino'
import readline from 'readline'
import { parsePhoneNumber } from 'awesome-phonenumber'
import fs from 'fs'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { logger, startAutoBio }    from '../utils/helpers.js'
import { handleMessage }           from './pipeline.js'
import { getGroup }                from './sqlite.js'
import { startReminderChecker }    from '../plugins/main-recordatorio.js'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  process.stdout.write('')
  return new Promise(r => rl.question(question, a => { rl.close(); r(a.trim()) }))
}

function normalizeNumber(num) {
  const pn = parsePhoneNumber(String(num))
  let limpio = (pn.valid ? pn.number : num).replace(/\D/g, '')
  if (limpio.startsWith('52') && !limpio.startsWith('521') && limpio.length === 12) {
    limpio = '521' + limpio.slice(2)
  }
  return limpio
}

function resolveNum(pid, lidCache) {
  if (pid.endsWith('@s.whatsapp.net')) return cleanNumber(pid)
  if (pid.endsWith('@lid')) {
    const cached = lidCache.get(pid) || global.lidCache?.get(pid)
    if (cached) return cleanNumber(cached)
  }
  return cleanNumber(pid)
}

const WELCOME_AUDIO_DEFAULT = 'https://www.image2url.com/r2/default/files/1781992178205-d92321c5-ab62-48a1-9e6b-e06e96f78c83.ogg'

// ─── Bot principal ────────────────────────────────────────────────────────────

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

  // ─── Pairing code si no hay sesión ────────────────────────────────────────
  if (!hasSession) {
    await new Promise(r => setTimeout(r, 1500))

    let numero = bot.botNumber ? normalizeNumber(String(bot.botNumber)) : ''

    if (numero) {
      process.stdout.write(`\n`)
      const usar = await ask(`  📱 Número detectado en config: ${numero}\n  ¿Usar este número? (s/n): `)
      if (!['s', 'si', 'sí', 'y', 'yes'].includes(usar.toLowerCase())) {
        const nuevo = await ask('  Ingresa el número con código de país (ej: 50412345678): ')
        numero = normalizeNumber(nuevo)
      }
    } else {
      process.stdout.write(`\n`)
      const ingresado = await ask('  Ingresa el número del bot con código de país (ej: 50412345678): ')
      numero = normalizeNumber(ingresado)
    }

    if (!numero || numero.length < 8) {
      logger.error('Pairing', 'Número inválido. Reiniciando...')
      setTimeout(startBot, 3000)
      return
    }

    logger.info('Pairing', `Solicitando código para ${numero}...`)
    try {
      const code = await sock.requestPairingCode(numero)
      const fmt  = code.match(/.{1,4}/g)?.join('-') || code
      process.stdout.write(`\n  🔑 Código de emparejamiento: ${fmt}\n\n`)
      process.stdout.write(`  Ingresa este código en WhatsApp:\n`)
      process.stdout.write(`  Dispositivos vinculados → Vincular dispositivo → Ingresar código\n\n`)
    } catch (err) {
      logger.error('Pairing', `Error al pedir código: ${err.message}`)
    }
  }

  // ─── Caché de JIDs ────────────────────────────────────────────────────────
  const lidCache = new Map()

  async function resolveParticipant(pid, groupId) {
    if (lidCache.has(pid))         return lidCache.get(pid)
    if (global.lidCache?.has(pid)) return global.lidCache.get(pid)
    try {
      const real = await getRealJid(sock, pid, { key: { remoteJid: groupId } })
      const num  = cleanNumber(real)
      if (num && num.length >= 8) {
        const jid = `${num}@s.whatsapp.net`
        lidCache.set(pid, jid)
        global.lidCache?.set(pid, jid)
        return jid
      }
    } catch {}
    const raw = pid.replace(/@.*$/, '').replace(/\D/g, '')
    return raw.length >= 8 ? `${raw}@s.whatsapp.net` : pid
  }

  // ─── Caché grupos.update ──────────────────────────────────────────────────
  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      try {
        const cfg = getGroup(update.id)

        if (cfg?.detect === 1) {
          if (update.subject !== undefined) {
            const quien = update.subjectOwner ? resolveNum(update.subjectOwner, lidCache) : null
            await sock.sendMessage(update.id, {
              text: quien
                ? `📝 *+${quien}* cambió el nombre del grupo a *${update.subject}*`
                : `📝 El nombre del grupo cambió a *${update.subject}*`
            }).catch(() => {})
          }

          if (update.desc !== undefined) {
            const quien = update.descOwner ? resolveNum(update.descOwner, lidCache) : null
            await sock.sendMessage(update.id, {
              text: quien
                ? `📋 *+${quien}* cambió la descripción del grupo.`
                : `📋 La descripción del grupo fue actualizada.`
            }).catch(() => {})
          }

          if (update.pictureUrl !== undefined || update.imgUrl !== undefined) {
            await sock.sendMessage(update.id, {
              text: `🖼️ *La foto del grupo fue actualizada.*`
            }).catch(() => {})
          }

          if (update.announce !== undefined) {
            const quien  = update.announceOwner ? resolveNum(update.announceOwner, lidCache) : null
            const estado = update.announce ? 'cerrado (solo admins)' : 'abierto (todos)'
            await sock.sendMessage(update.id, {
              text: quien
                ? `🔒 *+${quien}* ${update.announce ? 'cerró' : 'abrió'} el grupo. Ahora está *${estado}*.`
                : `🔒 El grupo ahora está *${estado}*.`
            }).catch(() => {})
          }
        }

        const meta = await sock.groupMetadata(update.id)
        for (const p of meta.participants) {
          if (p.id.endsWith('@lid') && p.phoneNumber) {
            const num = cleanNumber(p.phoneNumber)
            if (num) lidCache.set(p.id, `${num}@s.whatsapp.net`)
          }
        }
      } catch {}
    }
  })

  // ─── Detect: cambios de admin ─────────────────────────────────────────────
  sock.ev.on('group-participants.update', async ({ id, participants, action, author }) => {
    if (['add', 'remove'].includes(action)) {
      try {
        const cfg   = getGroup(id)
        const isAdd = action === 'add'

        // El grupo es la única fuente de verdad — sin fallback a global.features
        if (isAdd  && cfg.welcomeMsg !== 1) return
        if (!isAdd && cfg.goodbyeMsg !== 1) return

        const plantilla = isAdd
          ? (cfg.welcomeText || global.bot?.welcomeText || '')
          : (cfg.goodbyeText || global.bot?.goodbyeText || '')

        const imgUrl = isAdd
          ? (cfg.welcomeImg || global.bot?.welcomeImg || '')
          : (cfg.goodbyeImg || global.bot?.goodbyeImg || '')

        for (const p of participants) {
          const pid      = typeof p === 'string' ? p : (p.id || p.jid)
          const jidFinal = await resolveParticipant(pid, id)
          const num      = cleanNumber(jidFinal)
          const texto    = plantilla.replace(/[⁨⁩‎‏‪-‮]/g, '').replace(/@user/gi, `@${num}`)

          if (imgUrl) {
            let imageBuffer
            if (imgUrl.startsWith('file://')) {
              imageBuffer = fs.readFileSync(imgUrl.replace('file://', ''))
            } else {
              const response    = await fetch(imgUrl)
              const arrayBuffer = await response.arrayBuffer()
              imageBuffer       = Buffer.from(arrayBuffer)
            }
            await sock.sendMessage(id, { image: imageBuffer, caption: texto, mentions: [jidFinal] })
          } else {
            await sock.sendMessage(id, { text: texto, mentions: [jidFinal] })
          }

          // ── Audio de bienvenida como nota de voz — solo en "add" ─────────
          if (isAdd) {
            const audioUrl = cfg.welcomeAudio || WELCOME_AUDIO_DEFAULT
            try {
              let audioBuffer
              if (audioUrl.startsWith('file://')) {
                audioBuffer = fs.readFileSync(audioUrl.replace('file://', ''))
              } else {
                const response    = await fetch(audioUrl)
                const arrayBuffer = await response.arrayBuffer()
                audioBuffer       = Buffer.from(arrayBuffer)
              }
              await sock.sendMessage(id, {
                audio:    audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt:      true
              })
            } catch {}
          }
        }
      } catch {}
    }

    if (['promote', 'demote'].includes(action)) {
      try {
        const cfg = getGroup(id)
        if (cfg?.detect !== 1) return

        const quienNum = author ? resolveNum(author, lidCache) : null

        for (const p of participants) {
          const pid    = typeof p === 'string' ? p : (p.id || p.jid)
          const target = resolveNum(pid, lidCache)

          const texto = action === 'promote'
            ? quienNum
              ? `👑 *+${quienNum}* le dio admin a *+${target}*`
              : `👑 *+${target}* ahora es administrador`
            : quienNum
              ? `🔻 *+${quienNum}* le quitó admin a *+${target}*`
              : `🔻 *+${target}* ya no es administrador`

          const mentions = [
            ...(quienNum ? [`${quienNum}@s.whatsapp.net`] : []),
            `${target}@s.whatsapp.net`
          ]

          await sock.sendMessage(id, { text: texto, mentions }).catch(() => {})
        }
      } catch {}
    }
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
      global.connectionStartTime = Date.now()
      logger.info('Conexión', `${global.messages?.online} — ${sock.user.id.split(':')[0]}`)
      logger.info('Config', `Prefix: ${global.bot?.prefix?.join(' ')} | Grupos: activos`)
      startAutoBio(sock)
      startReminderChecker(sock)

      setTimeout(async () => {
        try {
          const groups = await sock.groupFetchAllParticipating()
          for (const [, meta] of Object.entries(groups)) {
            for (const p of meta.participants) {
              if (!p.id.endsWith('@lid')) continue
              const num = p.phoneNumber ? cleanNumber(p.phoneNumber) : null
              if (num && num.length >= 8) {
                const jid = `${num}@s.whatsapp.net`
                lidCache.set(p.id, jid)
                if (!global.lidCache) global.lidCache = new Map()
                global.lidCache.set(p.id, jid)
              }
            }
          }
          logger.info('Caché', 'JIDs pre-cacheados')
        } catch {}
      }, 3000)
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