import { getRealJid, cleanNumber } from '../utils/jid.js'
import {
  getSubbotByModerador,
  addSubbotGrupo,
  activarSubbotGrupo,
  desactivarSubbotGrupo,
  getAllSubbotGrupos,
  isGrupoActivoParaSubbot
} from '../core/sqlite.js'

async function getMiSubbot(sock, sender, msg) {
  const realJid = await getRealJid(sock, sender, msg).catch(() => sender)
  const userNum = cleanNumber(realJid)
  return getSubbotByModerador(userNum)
}

const activar = {
  command: ['activar', 'sbactivar'],
  tag: 'sbactivar',
  categoria: 'main',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Activa tu subbot en este grupo',

  async execute(sock, msg, { from, sender }) {
    const subbot = await getMiSubbot(sock, sender, msg)
    if (!subbot) {
      await sock.sendMessage(from, {
        text: '🌿 No tienes ningún subbot asignado.'
      }, { quoted: msg })
      return
    }

    const yaActivo = isGrupoActivoParaSubbot(subbot.numero, from)
    if (yaActivo) {
      await sock.sendMessage(from, {
        text: '🌸 Tu subbot ya está activo en este grupo.'
      }, { quoted: msg })
      return
    }

    addSubbotGrupo(subbot.numero, from)
    activarSubbotGrupo(subbot.numero, from)

    await sock.sendMessage(from, {
      text: `✅ Tu subbot *${subbot.numero}* ahora responde en este grupo.`
    }, { quoted: msg })
  }
}

const desactivar = {
  command: ['desactivar', 'sbdesactivar'],
  tag: 'sbdesactivar',
  categoria: 'main',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Desactiva tu subbot en este grupo',

  async execute(sock, msg, { from, sender }) {
    const subbot = await getMiSubbot(sock, sender, msg)
    if (!subbot) {
      await sock.sendMessage(from, {
        text: '🌿 No tienes ningún subbot asignado.'
      }, { quoted: msg })
      return
    }

    const yaActivo = isGrupoActivoParaSubbot(subbot.numero, from)
    if (!yaActivo) {
      await sock.sendMessage(from, {
        text: '🌸 Tu subbot ya estaba inactivo en este grupo.'
      }, { quoted: msg })
      return
    }

    desactivarSubbotGrupo(subbot.numero, from)

    await sock.sendMessage(from, {
      text: `🍃 Tu subbot *${subbot.numero}* dejó de responder en este grupo.`
    }, { quoted: msg })
  }
}

const grupos = {
  command: ['sbgrupos'],
  tag: 'sbgrupos',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Ver grupos activos de tu subbot',

  async execute(sock, msg, { from, sender }) {
    const subbot = await getMiSubbot(sock, sender, msg)
    if (!subbot) {
      await sock.sendMessage(from, {
        text: '🌿 No tienes ningún subbot asignado.'
      }, { quoted: msg })
      return
    }

    const listaGrupos = getAllSubbotGrupos(subbot.numero)

    if (listaGrupos.length === 0) {
      await sock.sendMessage(from, {
        text: `🌿 Tu subbot *${subbot.numero}* no tiene grupos configurados.\n\n_Usa *.activar* dentro de un grupo para activarlo._`
      }, { quoted: msg })
      return
    }

    let txt = `> ╭─〔 🌸 *GRUPOS DE TU SUBBOT* 〕\n`
    txt += `> │\n`
    txt += `> │ 📱 *Subbot:* ${subbot.numero}\n`
    txt += `> │\n`

    for (const g of listaGrupos) {
      const estado = g.activo === 1 ? '🟢' : '🔴'
      txt += `> │ ${estado} \`${g.group_id}\`\n`
    }

    const totalActivos = listaGrupos.filter(g => g.activo === 1).length
    txt += `> │\n`
    txt += `> ╰─── *${totalActivos} activo(s)* ✦`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}

// Exportar los tres como array — plugins.js los registra todos
export default [activar, desactivar, grupos]