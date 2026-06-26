import { setGroupField, getGroup } from '../core/sqlite.js'
import { writeFileSync }           from 'fs'
import { resolve }                 from 'path'
import { toBold }                  from '../utils/helpers.js'

// ─── Definición de features ───────────────────────────────────────────────────

const OWNER_FEATURES = {
  anticall:      { key: 'antiCall',     label: 'Anti llamadas' },
  autoread:      { key: 'autoRead',     label: 'Leer mensajes automático' },
  autobio:       { key: 'autoBio',      label: 'Bio automática' },
  antispam:      { key: 'antiSpam',     label: 'Anti spam' },
  antiprivado:   { key: 'allowPrivate', label: 'Bloquear uso en privado', invertido: true },
  mantenimiento: { key: 'maintenance',  label: 'Modo mantenimiento' },
}

const GROUP_FEATURES = {
  welcome:   { key: 'welcomeMsg', label: 'Bienvenidas y despedidas', extra: 'goodbyeMsg' },
  antilink:  { key: 'antiLink',   label: 'Anti enlaces' },
  antitoxic: { key: 'antiToxic',  label: 'Anti insultos' },
  modoadmin: { key: 'adminMode',  label: 'Solo admins' },
  economia:  { key: 'economia',   label: 'Economía' },
  detect:    { key: 'detect',     label: 'Detectar cambios del grupo' },
  saludos:   { key: 'saludos',    label: 'Saludos automáticos por horario' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function saveFeatures() {
  const f    = global.features
  const body = `const features = ${JSON.stringify(f, null, 2)}\n\nglobal.features = features\nexport default features\n`
  writeFileSync(resolve('settings/features.js'), body, 'utf8')
}

function on(val) {
  return val ? '🟢 *on*' : '⚪ *off*'
}

// ─── Lógica compartida enable/disable ────────────────────────────────────────

async function toggleFeature(activar, sock, msg, { from, args, isOwner, isAdmin, isGroup }) {
  const feature = args[0]?.toLowerCase()

  if (!feature) {
    const f   = global.features || {}
    const cfg = isGroup ? getGroup(from) : null

    let txt = `> ╭─〔 🌸 *${activar ? 'ENABLE' : 'DISABLE'}* 〕\n`
    txt += `> │\n`

    if (isOwner) {
      txt += `> │ ${toBold('Globales — owner')}\n`
      txt += `> │ ✦ anticall      ${on(f.antiCall)}\n`
      txt += `> │ ✦ autoread      ${on(f.autoRead)}\n`
      txt += `> │ ✦ autobio       ${on(f.autoBio)}\n`
      txt += `> │ ✦ antispam      ${on(f.antiSpam)}\n`
      txt += `> │ ✦ antiprivado   ${on(!f.allowPrivate)}\n`
      txt += `> │ ✦ mantenimiento ${on(f.maintenance)}\n`
      txt += `> │\n`
    }

    if (isGroup && cfg) {
      txt += `> │ ${toBold('Este grupo — admin o owner')}\n`
      txt += `> │ ✦ welcome    ${on(cfg.welcomeMsg === 1)}\n`
      txt += `> │ ✦ antilink   ${on(cfg.antiLink === 1)}\n`
      txt += `> │ ✦ antitoxic  ${on(cfg.antiToxic !== 0)}\n`
      txt += `> │ ✦ modoadmin  ${on(cfg.adminMode === 1)}\n`
      txt += `> │ ✦ economia   ${on(cfg.economia !== 0)}\n`
      txt += `> │ ✦ detect     ${on(cfg.detect === 1)}\n`
      txt += `> │ ✦ saludos    ${on(cfg.saludos === 1)}\n`
      txt += `> │\n`
    }

    txt += `> │ _Uso: .${activar ? 'enable' : 'disable'} <feature>_\n`
    txt += `> ╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
    return
  }

  // ── Feature de owner (global) ─────────────────────────────────────────────
  if (OWNER_FEATURES[feature]) {
    if (!isOwner) {
      await sock.sendMessage(from, { text: global.messages?.ownerOnly }, { quoted: msg })
      return
    }

    const def   = OWNER_FEATURES[feature]
    const valor = def.invertido ? !activar : activar

    global.features[def.key] = valor
    saveFeatures()

    await sock.sendMessage(from, { react: { text: activar ? '✅' : '🔴', key: msg.key } })
    await sock.sendMessage(from, {
      text: `${activar ? '✅' : '🔴'} *${def.label}* ${activar ? 'activado' : 'desactivado'} globalmente.`
    }, { quoted: msg })
    return
  }

  // ── Feature de grupo ──────────────────────────────────────────────────────
  if (GROUP_FEATURES[feature]) {
    if (!isGroup) {
      await sock.sendMessage(from, { text: global.messages?.groupOnly }, { quoted: msg })
      return
    }
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const def   = GROUP_FEATURES[feature]
    const valor = activar ? 1 : 0

    setGroupField(from, def.key, valor)
    if (def.extra) setGroupField(from, def.extra, valor)

    await sock.sendMessage(from, { react: { text: activar ? '✅' : '🔴', key: msg.key } })
    await sock.sendMessage(from, {
      text: `${activar ? '✅' : '🔴'} *${def.label}* ${activar ? 'activado' : 'desactivado'} en este grupo.`
    }, { quoted: msg })
    return
  }

  await sock.sendMessage(from, {
    text: `⚠️ *${feature}* no es una feature válida.\n_Escribe .${activar ? 'enable' : 'disable'} sin argumentos para ver la lista._`
  }, { quoted: msg })
}

// ─── Comandos ─────────────────────────────────────────────────────────────────

const enable = {
  command:     'enable',
  tag:         'enable',
  categoria:   'admin',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Activa una función del grupo',

  async execute(sock, msg, ctx) {
    await toggleFeature(true, sock, msg, ctx)
  }
}

const disable = {
  command:     'disable',
  tag:         'disable',
  categoria:   'admin',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Desactiva una función del grupo',

  async execute(sock, msg, ctx) {
    await toggleFeature(false, sock, msg, ctx)
  }
}

const config = {
  command:     'config',
  tag:         'config',
  categoria:   'admin',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra la configuración actual del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin, isGroup }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const f   = global.features || {}
    const cfg = isGroup ? getGroup(from) : null

    let txt = `> ╭─〔 🌸 *CONFIGURACIÓN* 〕\n`
    txt += `> │\n`

    if (isOwner) {
      txt += `> │ ${toBold('Globales')}\n`
      txt += `> │ ✦ anticall      ${on(f.antiCall)}\n`
      txt += `> │ ✦ autoread      ${on(f.autoRead)}\n`
      txt += `> │ ✦ autobio       ${on(f.autoBio)}\n`
      txt += `> │ ✦ antispam      ${on(f.antiSpam)}\n`
      txt += `> │ ✦ antiprivado   ${on(!f.allowPrivate)}\n`
      txt += `> │ ✦ mantenimiento ${on(f.maintenance)}\n`
      txt += `> │\n`
    }

    if (isGroup && cfg) {
      txt += `> │ ${toBold('Este grupo')}\n`
      txt += `> │ ✦ welcome    ${on(cfg.welcomeMsg === 1)}\n`
      txt += `> │ ✦ antilink   ${on(cfg.antiLink === 1)}\n`
      txt += `> │ ✦ antitoxic  ${on(cfg.antiToxic !== 0)}\n`
      txt += `> │ ✦ modoadmin  ${on(cfg.adminMode === 1)}\n`
      txt += `> │ ✦ economia   ${on(cfg.economia !== 0)}\n`
      txt += `> │ ✦ detect     ${on(cfg.detect === 1)}\n`
      txt += `> │ ✦ saludos    ${on(cfg.saludos === 1)}\n`
      txt += `> │\n`
    }

    txt += `> ╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    try {
      await sock.sendMessage(from, {
        image: { url: 'https://www.image2url.com/r2/default/images/1778698406704-04d69250-b32f-4f74-8514-8fbc6ac62bfc.png' },
        caption: txt
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: txt }, { quoted: msg })
    }
  }
}

export default [enable, disable, config]