// plugins/logo.js

import mumaker from 'mumaker'

const ESTILOS = {
  hacker:        'https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html',
  dragonball:    'https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html',
  naruto:        'https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html',
  sand:          'https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html',
  sunset:        'https://en.ephoto360.com/create-sunset-light-text-effects-online-807.html',
  chocolate:     'https://en.ephoto360.com/chocolate-text-effect-353.html',
  mechanical:    'https://en.ephoto360.com/create-your-name-in-a-mechanical-style-306.html',
  rain:          'https://en.ephoto360.com/foggy-rainy-text-effect-75.html',
  cloth:         'https://en.ephoto360.com/text-on-cloth-effect-62.html',
  water:         'https://en.ephoto360.com/create-water-effect-text-online-295.html',
  movie1917:     'https://en.ephoto360.com/1917-style-text-effect-523.html',
  graffiti:      'https://en.ephoto360.com/create-a-cartoon-style-graffiti-text-effect-online-668.html',
  boom:          'https://en.ephoto360.com/boom-text-comic-style-text-effect-675.html',
  cat:           'https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html',
  purple:        'https://en.ephoto360.com/purple-text-effect-online-100.html',
  gold:          'https://en.ephoto360.com/modern-gold-4-213.html',
  arena:         'https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html',
  incandescent:  'https://en.ephoto360.com/text-effects-incandescent-bulbs-219.html',
  child:         'https://en.ephoto360.com/write-text-on-wet-glass-online-589.html',
  typo:          'https://en.ephoto360.com/typography-text-effect-on-pavement-online-774.html',
  light:         'https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html',
  steel:         'https://en.ephoto360.com/dragon-steel-text-effect-online-347.html',
  sunlight:      'https://en.ephoto360.com/sunlight-shadow-text-204.html',
  frozen:        'https://en.ephoto360.com/create-a-frozen-christmas-text-effect-online-792.html',
  leaves:        'https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html',
  night:         'https://en.ephoto360.com/stars-night-online-1-85.html'
}

export default {
  command: ['logo', 'efecto'],
  tag: 'logo',
  categoria: 'utilidad',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      const estilos = Object.keys(ESTILOS).join(', ')
      return sock.sendMessage(from, {
        text: `🌱 *Elige un estilo y escribe un texto:*\n\n.logo hacker Midori\n\n📋 *Estilos:* ${estilos}`
      }, { quoted: msg })
    }

    const estilo = args[0].toLowerCase()
    const texto = args.slice(1).join(' ')

    if (!texto) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el texto para el logo*'
      }, { quoted: msg })
    }

    const url = ESTILOS[estilo]
    if (!url) {
      return sock.sendMessage(from, {
        text: `🌱 *Estilo no válido*\n\nUsa uno de: ${Object.keys(ESTILOS).join(', ')}`
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } })

      const result = await mumaker.ephoto(url, texto)

      if (!result?.image) {
        return sock.sendMessage(from, { text: '🌱 No se pudo generar el logo.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const imgRes = await fetch(result.image)
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      await sock.sendMessage(from, {
        image: imgBuffer,
        caption: `🌱 *${texto}* — ${estilo}`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}