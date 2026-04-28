import { setGroupField } from '../core/sqlite.js'

// Features globales — solo owner
const OWNER_FEATURES = {
  anticall:     'antiCall',
  autoread:     'autoRead',
  autobio:      'autoBio',
  maintenance:  'maintenance',
  allowprivate: 'allowPrivate',
  antispam:     'antiSpam',
}

// Features de grupo — admin o owner
const GROUP_FEATURES = {
  antilink:   'antiLink',
  welcomemsg: 'welcomeMsg',
  goodbyemsg: 'goodbyeMsg',
  nsfw:       'nsfw',
  adminmode:  'adminMode',
}

const HELP = `⚙️ *Features disponibles*

🔒 *Solo owner (globales):*
anticall, autoread, autobio, maintenance, allowprivate, antispam

👮 *Admin o owner (por grupo):*
antilink, welcomemsg, goodbyemsg, nsfw, adminmode

📌 *Uso:*
\`.enable antilink\`
\`.disable maintenance\``

export default {
  command: ['enable', 'disable'],
  owner:   false,
  group:   false,

  async execute(sock, msg, { from, args, isOwner, isAdmin, isGroup, prefix }) {
    const isEnable = msg.body?.trimStart().slice(prefix.length).split(' ')[0]?.toLowerCase() === 'enable'
    const feature  = args[0]?.toLowerCase()

    if (!feature) {
      await sock.sendMessage(from, { text: HELP }, { quoted: msg })
      return
    }

    // ─── Owner feature (global) ───────────────────────────────────────────
    if (OWNER_FEATURES[feature]) {
      if (!isOwner) {
        await sock.sendMessage(from, { text: global.messages?.ownerOnly }, { quoted: msg })
        return
      }
      const prop = OWNER_FEATURES[feature]
      global.features[prop] = isEnable
      await sock.sendMessage(from, {
        text: `${isEnable ? '✅' : '🔴'} *${prop}* ${isEnable ? 'activado' : 'desactivado'} globalmente.`
      }, { quoted: msg })
      return
    }

    // ─── Admin feature (por grupo) ────────────────────────────────────────
    if (GROUP_FEATURES[feature]) {
      if (!isGroup) {
        await sock.sendMessage(from, { text: global.messages?.groupOnly }, { quoted: msg })
        return
      }
      if (!isOwner && !isAdmin) {
        await sock.sendMessage(from, { text: global.messages?.adminOnly }, { quoted: msg })
        return
      }
      const prop = GROUP_FEATURES[feature]
      setGroupField(from, prop, isEnable ? 1 : 0)
      await sock.sendMessage(from, {
        text: `${isEnable ? '✅' : '🔴'} *${prop}* ${isEnable ? 'activado' : 'desactivado'} en este grupo.`
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, {
      text: `⚠️ *${feature}* no reconocido.\nEscribe *.enable* sin argumentos para ver la lista.`
    }, { quoted: msg })
  }
}