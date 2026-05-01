// plugins/tiktokstalk.js

import axios from 'axios'

export default {
  command:   ['tiktokstalk', 'ttstalk', 'stalktt'],
  tag:       'tiktokstalk',
  categoria: 'busqueda',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el nombre de usuario de TikTok*\n\nEjemplo: *.ttstalk yj.espinox*'
      }, { quoted: msg })
    }

    const username = args[0].replace('@', '')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.get(
        `https://api.princetechn.com/api/stalk/tiktokstalk?apikey=prince&username=${encodeURIComponent(username)}`,
        { timeout: 15000 }
      )

      if (!data.success || !data.result) {
        return await sock.sendMessage(from, {
          text: '🌱 No se encontró el usuario.'
        }, { quoted: msg })
      }

      const r = data.result

      // Si es privada, no mostrar nada más
      if (r.private === true) {
        await sock.sendMessage(from, { react: { text: '🔒', key: msg.key } })
        return await sock.sendMessage(from, {
          text: '🔒 *La cuenta ingresada es privada.*'
        }, { quoted: msg })
      }

      let txt = `🌱 *${r.name}*\n\n`
      txt += `✦ *Usuario:* @${r.username}\n`
      if (r.bio) txt += `✦ *Bio:* ${r.bio}\n`
      txt += `✦ *Seguidores:* ${r.followers?.toLocaleString() || 0}\n`
      txt += `✦ *Siguiendo:* ${r.following?.toLocaleString() || 0}\n`
      txt += `✦ *Likes:* ${r.likes?.toLocaleString() || 0}\n`
      if (r.verified) txt += `✦ *Verificado:* ✅\n`

      try {
        const imgRes = await axios.get(r.avatar, {
          responseType: 'arraybuffer',
          timeout: 10000
        })
        await sock.sendMessage(from, {
          image: Buffer.from(imgRes.data),
          caption: txt
        }, { quoted: msg })
      } catch {
        await sock.sendMessage(from, { text: txt }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}