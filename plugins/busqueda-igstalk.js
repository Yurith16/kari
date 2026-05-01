// plugins/igstalk.js

import axios from 'axios'

function decodeHtml(html) {
  if (!html) return ''
  return html
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#064;/g, '@')
}

async function getInstagramArtist(username) {
  const { gotScraping } = await import('got-scraping')
  const url = `https://www.instagram.com/${username}/`

  try {
    const response = await gotScraping.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8',
        'Cookie': `ds_user_id=62651663557; sessionid=62651663557%3AOnk9AILYgOe6m0%3A18%3AAYibO-smXQ3sg5S3F7iXfXj7LimmrQrF4WY9GwAuGQ;`
      }
    })

    const html = response.body

    const title = decodeHtml(
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1] || ''
    )
    const description = decodeHtml(
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1] || ''
    )

    if (!description) throw new Error('No se pudo obtener la descripción. Cookie vencida.')

    const parts = description.split(',')

    let nombre = username
    if (title) {
      const match = title.match(/^(.+?)\s*\(@/)
      if (match) nombre = match[1].trim()
      else if (title.includes('•')) nombre = title.split('•')[0].trim()
      else if (title.includes('(@')) nombre = title.split('(@')[0].trim()
    }

    return {
      usuario: username,
      nombre: nombre,
      seguidores: parts[0] ? parts[0].replace(/Followers|Seguidores/gi, '').trim() : 'N/A',
      seguidos: parts[1] ? parts[1].replace(/Following|Seguidos/gi, '').trim() : 'N/A',
      posts: parts[2] ? parts[2].split('-')[0].replace(/Posts|Publicaciones/gi, '').trim() : 'N/A',
      url_perfil: url
    }

  } catch (e) {
    return null
  }
}

export default {
  command:   ['igstalk', 'instagramstalk', 'stalkig'],
  tag:       'igstalk',
  categoria: 'busqueda',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el nombre de usuario de Instagram*\n\nEjemplo: *.igstalk badbonhy*'
      }, { quoted: msg })
    }

    const username = args[0].replace('@', '')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const info = await getInstagramArtist(username)

      if (!info) {
        return await sock.sendMessage(from, {
          text: '🌱 No se encontró el usuario o la cookie expiró.'
        }, { quoted: msg })
      }

      let txt = `🌱 *${info.nombre}*\n\n`
      txt += `✦ *Usuario:* @${info.usuario}\n`
      txt += `✦ *Publicaciones:* ${info.posts}\n`
      txt += `✦ *Seguidores:* ${info.seguidores}\n`
      txt += `✦ *Siguiendo:* ${info.seguidos}\n`

      await sock.sendMessage(from, { text: txt }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}