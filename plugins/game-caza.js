// plugins/eco-cazar.js
import { addKryons, addXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const animales = [
  { emoji: '🐂', nombre: 'búfalo' },
  { emoji: '🐅', nombre: 'tigre' },
  { emoji: '🐘', nombre: 'elefante' },
  { emoji: '🐐', nombre: 'cabra' },
  { emoji: '🐼', nombre: 'panda' },
  { emoji: '🐊', nombre: 'cocodrilo' },
  { emoji: '🐃', nombre: 'búfalo salvaje' },
  { emoji: '🐮', nombre: 'vaca' },
  { emoji: '🐒', nombre: 'mono' },
  { emoji: '🐗', nombre: 'jabalí' },
  { emoji: '🐖', nombre: 'cerdo' },
  { emoji: '🐓', nombre: 'gallo' },
  { emoji: '🦌', nombre: 'ciervo' },
  { emoji: '🐇', nombre: 'conejo' },
  { emoji: '🦊', nombre: 'zorro' },
  { emoji: '🐻', nombre: 'oso' },
  { emoji: '🦅', nombre: 'águila' },
  { emoji: '🐍', nombre: 'serpiente' },
  { emoji: '🐎', nombre: 'caballo' },
  { emoji: '🐏', nombre: 'carnero' },
  { emoji: '🐑', nombre: 'oveja' },
  { emoji: '🐪', nombre: 'camello' },
  { emoji: '🐫', nombre: 'dromedario' },
  { emoji: '🦒', nombre: 'jirafa' },
  { emoji: '🦘', nombre: 'canguro' },
  { emoji: '🦏', nombre: 'rinoceronte' },
  { emoji: '🦛', nombre: 'hipopótamo' },
  { emoji: '🐁', nombre: 'ratón' },
  { emoji: '🐀', nombre: 'rata' },
  { emoji: '🐿️', nombre: 'ardilla' },
  { emoji: '🦔', nombre: 'erizo' },
  { emoji: '🦇', nombre: 'murciélago' },
  { emoji: '🐺', nombre: 'lobo' },
  { emoji: '🐆', nombre: 'leopardo' },
  { emoji: '🦓', nombre: 'cebra' },
  { emoji: '🐈', nombre: 'gato salvaje' },
  { emoji: '🐕', nombre: 'perro salvaje' },
  { emoji: '🦎', nombre: 'lagarto' },
  { emoji: '🐢', nombre: 'tortuga' },
  { emoji: '🦂', nombre: 'escorpión' },
  { emoji: '🕷️', nombre: 'araña' },
  { emoji: '🐝', nombre: 'abeja reina' },
  { emoji: '🦋', nombre: 'mariposa' },
  { emoji: '🐞', nombre: 'catarina' },
  { emoji: '🦗', nombre: 'grillo' },
  { emoji: '🦟', nombre: 'mosquito' },
  { emoji: '🪲', nombre: 'escarabajo' },
  { emoji: '🪳', nombre: 'cucaracha' },
  { emoji: '🐜', nombre: 'hormiga' },
  { emoji: '🦀', nombre: 'cangrejo' },
  { emoji: '🦞', nombre: 'langosta' },
  { emoji: '🦐', nombre: 'camarón' },
  { emoji: '🐙', nombre: 'pulpo' },
  { emoji: '🦑', nombre: 'calamar' },
  { emoji: '🐠', nombre: 'pez tropical' },
  { emoji: '🐟', nombre: 'pez' },
  { emoji: '🐡', nombre: 'pez globo' },
  { emoji: '🦈', nombre: 'tiburón' },
  { emoji: '🐬', nombre: 'delfín' },
  { emoji: '🐋', nombre: 'ballena' },
  { emoji: '🐊', nombre: 'caimán' },
  { emoji: '🦩', nombre: 'flamenco' },
  { emoji: '🦢', nombre: 'cisne' },
  { emoji: '🦜', nombre: 'loro' },
  { emoji: '🦚', nombre: 'pavo real' },
  { emoji: '🦃', nombre: 'pavo' },
  { emoji: '🐧', nombre: 'pingüino' },
  { emoji: '🕊️', nombre: 'paloma' },
  { emoji: '🦉', nombre: 'búho' },
  { emoji: '🦅', nombre: 'halcón' },
  { emoji: '🐦', nombre: 'pájaro' },
  { emoji: '🐤', nombre: 'pollito' },
  { emoji: '🐣', nombre: 'pollito bebé' },
  { emoji: '🐥', nombre: 'polluelo' },
  { emoji: '🦆', nombre: 'pato' },
  { emoji: '🐸', nombre: 'rana' },
  { emoji: '🐊', nombre: 'reptil' },
  { emoji: '🦕', nombre: 'dinosaurio' },
  { emoji: '🦖', nombre: 'tiranosaurio' },
  { emoji: '🐉', nombre: 'dragón' },
  { emoji: '🐲', nombre: 'dragón verde' },
  { emoji: '🦄', nombre: 'unicornio' },
  { emoji: '🐴', nombre: 'pony' },
  { emoji: '🫎', nombre: 'alce' },
  { emoji: '🫏', nombre: 'burro' },
  { emoji: '🐩', nombre: 'caniche salvaje' },
  { emoji: '🐈‍⬛', nombre: 'pantera' },
  { emoji: '🐓', nombre: 'gallina' },
  { emoji: '🦤', nombre: 'dodo' },
  { emoji: '🪿', nombre: 'ganso' },
  { emoji: '🐿️', nombre: 'ardilla voladora' },
  { emoji: '🦫', nombre: 'castor' },
  { emoji: '🦦', nombre: 'nutria' },
  { emoji: '🦥', nombre: 'perezoso' },
  { emoji: '🦭', nombre: 'foca' },
  { emoji: '🐚', nombre: 'caracola' },
  { emoji: '🐌', nombre: 'caracol' },
  { emoji: '🦪', nombre: 'ostra' },
  { emoji: '🐾', nombre: 'huellas' },
  { emoji: '🦴', nombre: 'hueso' },
]

const frasesInicio = [
  'Preparando el equipo de caza...',
  'Adentrándose en el bosque...',
  'Buscando huellas frescas...',
  'El viento está a favor, buena señal...',
  'Alistando las armas, hoy hay cacería...',
  'Siguiendo el rastro en la espesura...',
]

const frasesDeteccion = [
  '¡Animales avistados! Apuntando...',
  '¡Hay movimiento entre los árboles!',
  '¡Manada detectada!',
  '¡Objetivos fijados!',
]

const frasesFinal = [
  'Volviste de la cacería con {kryons} y {xp} de exp. Midori aplaude tu puntería.',
  'La caza fue generosa, trajiste {kryons} y {xp} de exp. El jardín celebra.',
  'Regresaste del bosque con {kryons} y {xp} de exp. Buen ojo, cazador.',
  'Entre árboles y rastros conseguiste {kryons} y {xp} de exp. Midori está orgullosa.',
  'La expedición valió la pena, recolectaste {kryons} y {xp} de exp. ¡Bien hecho!',
  'Tus habilidades de caza dieron frutos: {kryons} y {xp} de exp para tu jardín.',
]

export default {
  command: ['cazar', 'hunt', 'caza', 'caceria'],
  tag: 'cazar',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Ve de cacería para ganar kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'cazar', 600)
    if (!cd.ok) {
      const mins = Math.ceil(cd.secsLeft / 60)
      return sock.sendMessage(from, {
        text: `> 🌸 Aún estás descansando de la última cacería. Vuelve en *${mins}* minuto(s).`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'cazar')

    await sock.sendMessage(from, { react: { text: '🏹', key: msg.key } })

    // Fase 1: Preparación
    const frase1 = frasesInicio[Math.floor(Math.random() * frasesInicio.length)]
    const msgCaza = await sock.sendMessage(from, { text: `> 🌿 ${frase1}` }, { quoted: msg })
    await new Promise(r => setTimeout(r, 3000))

    // Fase 2: Detección
    const frase2 = frasesDeteccion[Math.floor(Math.random() * frasesDeteccion.length)]
    await sock.sendMessage(from, { edit: msgCaza.key, text: `> 👀 ${frase2}` })
    await new Promise(r => setTimeout(r, 3000))

    // Fase 3: Resultado
    const capturados = []
    const usados = new Set()
    let totalKryons = 0
    let totalXp = 0

    for (let i = 0; i < 6; i++) {
      let animal
      do {
        animal = animales[Math.floor(Math.random() * animales.length)]
      } while (usados.has(animal.emoji))
      usados.add(animal.emoji)

      const kryons = Math.floor(Math.random() * 700) + 200
      capturados.push({ ...animal, kryons })
      totalKryons += kryons
      totalXp += Math.floor(kryons / 4)
    }

    addKryons(selfNum, totalKryons)
    addXp(selfNum, totalXp)

    let txt = `> ✦ *CACERÍA*\n`

    capturados.forEach(a => {
      txt += `> ✦ ${a.emoji} ${a.nombre}\n`
    })

    const frase = frasesFinal[Math.floor(Math.random() * frasesFinal.length)]
      .replace('{kryons}', `*${totalKryons.toLocaleString()} kryons*`)
      .replace('{xp}', `*${totalXp}*`)
    txt += `> 🌸 ${frase}`

    await sock.sendMessage(from, { edit: msgCaza.key, text: txt })
  }
}