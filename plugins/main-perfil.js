import fs from 'fs'
import axios from 'axios'
import { getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'
import { toMono } from '../utils/helpers.js'

const PERFIL_DEFAULT_IMG = 'https://www.image2url.com/r2/default/images/1780714746057-12c23aaf-4846-4012-b243-4d4f3bb09b4e.png'

const BULLETS = ['🐞', '📍', '🐝']

function formatDate(timestamp) {
  if (!timestamp || timestamp === 0) return null
  const date = new Date(timestamp * 1000)
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const año = date.getFullYear()
  return `${dia}/${mes}/${año}`
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
  descripcion: 'Muestra tu perfil o el de alguien más',

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
      return sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }

    const perfil = getUser(user)
    if (!perfil) {
      const esSelf = !target?.num
      return sock.sendMessage(from, {
        text: esSelf ? global.messages.notRegistered : 'Ese usuario aún no tiene un perfil creado.'
      }, { quoted: msg })
    }

    const bullet = BULLETS[Math.floor(Math.random() * BULLETS.length)]

    let txt = `> ╭─〔 🌸 *Esencia* 🌸 〕\n`

    txt += `> │ ${bullet} *Nombre* · ${perfil.nombre}\n`
    if (perfil.apodo) txt += `> │ ${bullet} *Apodo* · ${perfil.apodo}\n`
    txt += `> │ ${bullet} *Edad* · ${perfil.edad} años\n`
    if (perfil.genero) txt += `> │ ${bullet} *Género* · ${perfil.genero}\n`
    if (perfil.pais) txt += `> │ ${bullet} *País* · ${perfil.pais}\n`
    if (perfil.registered_at) txt += `> │ ${bullet} *Registrado* · ${formatDate(perfil.registered_at)}\n`

    if (perfil.frase || perfil.color || perfil.animal) {
      if (perfil.frase) txt += `> │ ${bullet} *Frase* · _${perfil.frase}_\n`
      if (perfil.color) txt += `> │ ${bullet} *Color* · ${perfil.color}\n`
      if (perfil.animal) txt += `> │ ${bullet} *Animal* · ${perfil.animal}\n`
    }

    if (perfil.estado === 'en_relacion') {
      txt += `> │ ${bullet} *Estado* · En relación\n`
    } else if (perfil.estado === 'casado') {
      txt += `> │ ${bullet} *Estado* · Casado\n`
    } else {
      txt += `> │ ${bullet} *Estado* · Soltero\n`
    }

    if (perfil.pareja) {
      const parejaPerfil = getUser(perfil.pareja)
      txt += `> │ ${bullet} *Pareja* · ${parejaPerfil?.nombre || perfil.pareja}\n`
    }
    if (perfil.noviazgo_fecha) {
      txt += `> │ ${bullet} *Novios* · ${tiempoTranscurrido(perfil.noviazgo_fecha)}\n`
    }
    if (perfil.matrimonio_fecha) {
      txt += `> │ ${bullet} *Casados* · ${tiempoTranscurrido(perfil.matrimonio_fecha)}\n`
    }

    txt += `> ╰─── ${toMono(global.bot?.name || 'Midori-Hana')}`

    const mentions = target?.num ? [`${target.num}@s.whatsapp.net`] : []
    const fotoFinal = esFotoValida(perfil.foto) ? perfil.foto : PERFIL_DEFAULT_IMG
    const tipoFoto = esFotoValida(fotoFinal)

    await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

    if (tipoFoto) {
      try {
        const imgBuffer = tipoFoto === 'url'
          ? Buffer.from((await axios.get(fotoFinal, { responseType: 'arraybuffer', timeout: 15000 })).data)
          : fs.readFileSync(fotoFinal)

        const esVideo = fotoFinal.endsWith('.mp4')
        const esGif = fotoFinal.endsWith('.gif') || fotoFinal.endsWith('.webp')

        if (esVideo) {
          await sock.sendMessage(from, { video: imgBuffer, caption: txt, mentions }, { quoted: msg })
        } else if (esGif) {
          await sock.sendMessage(from, { video: imgBuffer, gifPlayback: true, caption: txt, mentions }, { quoted: msg })
        } else {
          await sock.sendMessage(from, { image: imgBuffer, caption: txt, mentions }, { quoted: msg })
        }
      } catch {
        await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
      }
    } else {
      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    }
  }
}