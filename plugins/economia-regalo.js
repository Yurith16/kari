// plugins/eco-regalo.js
import { addKryons, getUser, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const cooldownsGrupo = new Map()

const razones = [
  'por iluminar el jardín con su presencia.',
  'por ser quien más flores riega cada día.',
  'por tener la sonrisa más bonita del grupo.',
  'por siempre ayudar sin esperar nada a cambio.',
  'por ser el alma de la fiesta en el jardín.',
  'por sus buenas vibras que se sienten de lejos.',
  'por ser el abrazo cálido que todo grupo necesita.',
  'por nunca faltar y estar siempre presente.',
  'por ser esa persona que alegra hasta a las abejas.',
  'por tener un corazón que florece hasta en invierno.',
  'por compartir su luz sin pedir nada.',
  'por ser el favorito secreto del jardín desde hace tiempo.',
  'por hacer reír hasta a las flores marchitas.',
  'por ser el rayito de sol de cada mañana.',
  'por tener tanta bondad que hasta Midori se sonroja.',
  'por ser único, auténtico y maravilloso.',
  'porque el jardín no sería igual sin su risa.',
  'por ser la prueba de que la gente bonita existe.',
  'por contagiar su alegría como el viento de primavera.',
  'por ser simplemente increíble, sin más.',
]

export default {
  command: ['regalo', 'favorito'],
  tag: 'regalo',
  categoria: 'economia',
  owner: false,
  group: true,
  nsfw: false,
  descripcion: 'Descubre quién es el favorito de Midori en el grupo',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (!isGroup) {
      return sock.sendMessage(from, { text: '🌸 Este comando solo se usa en grupos.' }, { quoted: msg })
    }

    if (groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const ahora = Date.now()
    const ultimoUso = cooldownsGrupo.get(from)
    if (ultimoUso && ahora - ultimoUso < 7200000) {
      const restante = Math.ceil((7200000 - (ahora - ultimoUso)) / 60000)
      return sock.sendMessage(from, {
        text: `🌸 Midori ya eligió a su favorito en este grupo. Vuelve en *${restante}* minuto(s).`
      }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const metadata = await sock.groupMetadata(from).catch(() => null)
    if (!metadata) return

    const participantes = metadata.participants || []
    const registrados = []

    for (const p of participantes) {
      const realJid = await getRealJid(sock, p.id, msg).catch(() => p.id)
      const num = cleanNumber(realJid)
      if (isRegistered(num)) {
        registrados.push({ num, jid: realJid })
      }
    }

    if (registrados.length === 0) {
      return sock.sendMessage(from, {
        text: '🌸 No hay nadie registrado en este jardín aún.'
      }, { quoted: msg })
    }

    cooldownsGrupo.set(from, ahora)

    const elegido = registrados[Math.floor(Math.random() * registrados.length)]
    const perfil = getUser(elegido.num)
    const nombre = perfil?.nombre || elegido.num
    const razon = razones[Math.floor(Math.random() * razones.length)]
    const regalo = Math.floor(Math.random() * 14500) + 500

    addKryons(elegido.num, regalo)

    await sock.sendMessage(from, { react: { text: '🎁', key: msg.key } })

    if (elegido.num === selfNum) {
      await sock.sendMessage(from, {
        text: `🌸 ¡Qué suerte! @${selfNum} eres el favorito de Midori hoy. Te regala *${regalo.toLocaleString()} kryons* ${razon}`,
        mentions: [selfJid]
      }, { quoted: msg })
    } else {
      await sock.sendMessage(from, {
        text: `🌸 Midori miró todo el jardín y hoy su favorito es @${elegido.num}. Le regala *${regalo.toLocaleString()} kryons* ${razon}`,
        mentions: [elegido.jid]
      }, { quoted: msg })
    }
  }
}