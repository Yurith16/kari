import fs from 'fs'
import axios from 'axios'
import { getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'
import { resolveTarget } from '../utils/target.js'

function formatDate(timestamp) {
  if (!timestamp || timestamp === 0) return null
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function tiempoTranscurrido(timestamp) {
  if (!timestamp || timestamp === 0) return null
  const ahora = Math.floor(Date.now() / 1000)
  const diff = ahora - timestamp
  const dias = Math.floor(diff / 86400)
  const meses = Math.floor(dias / 30)
  const años = Math.floor(dias / 365)
  if (años > 0) return `${años} año${años > 1 ? 's' : ''}`
  if (meses > 0) return `${meses} mes${meses > 1 ? 'es' : ''}`
  if (dias > 0) return `${dias} día${dias > 1 ? 's' : ''}`
  return 'Hoy'
}

function esFotoValida(str) {
  if (!str) return false
  if (str.startsWith('http://') || str.startsWith('https://')) return 'url'
  if (fs.existsSync(str)) return 'local'
  return false
}

export default {
  command: ['perfil', 'profile', 'me'],
  tag: 'perfil',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Muestra tu perfil',

  async execute(sock, msg, { from, args, sender }) {
    const target = args.length ? await resolveTarget(sock, msg, args) : null
    let user

    if (target?.num) {
      user = target.num
    } else {
      const realJid = await getRealJid(sock, sender, msg).catch(() => sender)
      user = cleanNumber(realJid)
    }

    if (!user) {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
      return
    }

    const perfil = getUser(user)
    if (!perfil) {
      const esSelf = !target?.num
      await sock.sendMessage(from, {
        text: esSelf
          ? global.messages.notRegistered
          : '🌸 Ese usuario aún no tiene un perfil creado.'
      }, { quoted: msg })
      return
    }

    const estadoEmoji = perfil.estado === 'en_relacion' ? '💑' : perfil.estado === 'casado' ? '💍' : '🌿'
    const estadoTexto = perfil.estado === 'en_relacion' ? 'En relación' : perfil.estado === 'casado' ? 'Casado/a' : 'Soltero/a'
    const fechaRegistro = formatDate(perfil.registered_at)

    let txt = `> ╭─〔 🌸 *PERFIL* 〕\n`
    txt += `> │\n`
    txt += `> │ ✦ *Nombre:* ${perfil.nombre}\n`
    if (perfil.apodo)  txt += `> │ ✦ *Apodo:* ${perfil.apodo}\n`
    txt += `> │ ✦ *Edad:* ${perfil.edad} años\n`
    if (perfil.genero) txt += `> │ ✦ *Género:* ${perfil.genero === 'hombre' ? '👦' : perfil.genero === 'mujer' ? '👧' : '🌿'} ${perfil.genero}\n`
    if (perfil.pais)   txt += `> │ ✦ *País:* ${perfil.pais}\n`
    if (fechaRegistro) txt += `> │ ✦ *Registrado:* ${fechaRegistro}\n`
    if (perfil.frase)  txt += `> │ ✦ *Frase:* ${perfil.frase}\n`
    if (perfil.color)  txt += `> │ ✦ *Color favorito:* ${perfil.color}\n`
    if (perfil.animal) txt += `> │ ✦ *Animal favorito:* ${perfil.animal}\n`
    txt += `> │ ✦ *Estado:* ${estadoEmoji} ${estadoTexto}\n`

    if (perfil.pareja) {
      const parejaPerfil = getUser(perfil.pareja)
      txt += `> │ ✦ *Pareja:* ${parejaPerfil?.nombre || perfil.pareja}\n`
    }
    if (perfil.noviazgo_fecha) {
      txt += `> │ ✦ *Novios desde:* ${formatDate(perfil.noviazgo_fecha)} (${tiempoTranscurrido(perfil.noviazgo_fecha)})\n`
    }
    if (perfil.matrimonio_fecha) {
      txt += `> │ ✦ *Casados desde:* ${formatDate(perfil.matrimonio_fecha)} (${tiempoTranscurrido(perfil.matrimonio_fecha)})\n`
    }

    txt += `> │\n`
    txt += `> ╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    const mentions = target?.num ? [`${target.num}@s.whatsapp.net`] : []
    const tipoFoto = esFotoValida(perfil.foto)

    if (tipoFoto) {
  try {
    const imgBuffer = tipoFoto === 'url'
      ? Buffer.from((await axios.get(perfil.foto, { responseType: 'arraybuffer', timeout: 15000 })).data)
      : fs.readFileSync(perfil.foto)

    const fotoPath = perfil.foto || ''
    const esVideo = fotoPath.endsWith('.mp4')
    const esGif   = fotoPath.endsWith('.gif') || fotoPath.endsWith('.webp')

    if (esVideo) {
      await sock.sendMessage(from, {
        video: imgBuffer,
        caption: txt,
        mentions
      }, { quoted: msg })
    } else if (esGif) {
      await sock.sendMessage(from, {
        video: imgBuffer,
        gifPlayback: true,
        caption: txt,
        mentions
      }, { quoted: msg })
    } else {
      await sock.sendMessage(from, {
        image: imgBuffer,
        caption: txt,
        mentions
      }, { quoted: msg })
    }
  } catch {
    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
} else {
  await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
}
  }
}