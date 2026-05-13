// plugins/pfoto.js

import { setUserField, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     'pfoto',
  tag:         'pfoto',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Establece tu foto de perfil con una URL',

  async execute(sock, msg, { from, args, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (!args.length) {
      return sock.sendMessage(from, {
        text: `🌸 Envíame la URL de la foto que quieres poner en tu perfil.\n\n🌐 Si aún no tienes una, súbela aquí:\nhttps://www.image2url.com/es\n\n_Ejemplo: .pfoto https://i.imgur.com/tufoto.jpg_`
      }, { quoted: msg })
    }

    const url = args[0]

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return sock.sendMessage(from, {
        text: '🌸 Esa no parece una URL válida, corazón. Asegúrate de que empiece con http:// o https://'
      }, { quoted: msg })
    }

    setUserField(selfNum, 'foto', url)

    await sock.sendMessage(from, {
      image: { url },
      caption: `🌸 ¡Qué bonita foto! Así te verán en tu perfil.`
    }, { quoted: msg })
  }
}