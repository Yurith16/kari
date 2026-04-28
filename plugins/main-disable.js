import { setGroupField } from '../core/sqlite.js'
import { writeFileSync }  from 'fs'
import { resolve }        from 'path'

const OWNER_FEATURES = {
  anticall:     'antiCall',
  autoread:     'autoRead',
  autobio:      'autoBio',
  maintenance:  'maintenance',
  allowprivate: 'allowPrivate',
  antispam:     'antiSpam',
}

const GROUP_FEATURES = {
  antilink:   'antiLink',
  welcomemsg: 'welcomeMsg',
  goodbyemsg: 'goodbyeMsg',
  nsfw:       'nsfw',
  adminmode:  'adminMode',
}

function saveFeatures() {
  const f    = global.features
  const body = `const features = ${JSON.stringify(f, null, 2)}\n\nglobal.features = features\nexport default features\n`
  writeFileSync(resolve('settings/features.js'), body, 'utf8')
}

export default {
  command: 'disable',
  tag: 'disable',           // nombre del comando para identificación
  categoria: 'main',
  owner:   false,
  group:   false,

  async execute(sock, msg, { from, args, isOwner, isAdmin, isGroup }) {
    const feature = args[0]?.toLowerCase()

    if (!feature) {
      await sock.sendMessage(from, {
        text: `⚙️ *Uso:* .disable <feature>\n\n🔒 *Owner:* ${Object.keys(OWNER_FEATURES).join(', ')}\n👮 *Admin:* ${Object.keys(GROUP_FEATURES).join(', ')}`
      }, { quoted: msg })
      return
    }

    if (OWNER_FEATURES[feature]) {
      if (!isOwner) { await sock.sendMessage(from, { text: global.messages?.ownerOnly }, { quoted: msg }); return }
      global.features[OWNER_FEATURES[feature]] = false
      saveFeatures()
      await sock.sendMessage(from, { text: `🔴 *${OWNER_FEATURES[feature]}* desactivado globalmente.` }, { quoted: msg })
      return
    }

    if (GROUP_FEATURES[feature]) {
      if (!isGroup) { await sock.sendMessage(from, { text: global.messages?.groupOnly }, { quoted: msg }); return }
      if (!isOwner && !isAdmin) { await sock.sendMessage(from, { text: global.messages?.adminOnly }, { quoted: msg }); return }
      setGroupField(from, GROUP_FEATURES[feature], 0)
      await sock.sendMessage(from, { text: `🔴 *${GROUP_FEATURES[feature]}* desactivado en este grupo.` }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { text: `⚠️ Feature *${feature}* no reconocido.` }, { quoted: msg })
  }
}