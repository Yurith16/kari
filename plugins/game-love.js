// plugins/amor.js
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

const frases10 = [
  'Analizando miradas cruzadas... 👀', 'Revisando chats archivados... 🕵️‍♀️', 'Buscando indirectas en los estados... 📝',
  'Contando las veces que se dejaron en visto... 📱', 'Midiendo la tensión en el grupo... ⚡', 'Interceptando telepatía amorosa... 🧠',
  'Extrayendo capturas de pantalla secretas... 📸', 'Evaluando el primer "hola"... 👋', 'Espiando reacciones en fotos antiguas... 😏',
  'Desenterrando indirectas de Twitter... 🐦', 'Analizando stickers sospechosos... 🦊', 'Calculando el delay al responder... ⏱️',
]

const frases40 = [
  'Midiendo los latidos del corazón... 💓', 'Calculando celos mal disimulados... 🧐', 'Analizando el tono de las notas de voz... 🎙️',
  'Contando los emojis de corazones usados... ❤️', 'Evaluando el nivel de coqueteo sutil... 💋', 'Sumando las risas compartidas... 😂',
  'Descifrando miradas en la vida real... 😳', 'Sincronizando suspiros secretos... 💨', 'Revisando el historial de apodos cursis... 🧸',
  'Midiendo la velocidad de los tecleos... ⌨️', 'Analizando indirectas muy directas... 🎯', 'Calculando la proximidad física... 📏',
]

const frases80 = [
  'Preparando el veredicto final... 😳', 'Cruzando datos con el destino... 🌌', 'Consultando al Oráculo de Midori... 🔮',
  'Afilando las flechas de Cupido... 🏹', 'Sellando los resultados químicos... 🧪', 'Ajustando los niveles de romanticismo... 🌹',
  'Debatiendo si habrá drama o boda... 🎭', 'Calculando la resistencia al casamiento... 💍', 'Confirmando si es amor o capricho... 🌪️',
  'Verificando si hay corazones rotos en camino... 💔', 'Asegurando las mariposas para que no escapen... 🦋', 'Anotando las conclusiones del chisme... 📝',
]

export default {
  command: ['love', 'amor'],
  tag: 'amor',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Calcula el porcentaje de amor entre dos personas',

  async execute(sock, msg, { from, args, sender }) {
    const target = await resolveTarget(sock, msg, args).catch(() => null)

    if (!target?.num) {
      return sock.sendMessage(from, { text: '> 🩷 Menciona o responde al mensaje de alguien para medir el amor.' }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)
    const targetNum = target.num
    const targetJid = `${targetNum}@s.whatsapp.net`

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: '> 🩷 ¿Medir el amor contigo mismo? Qué egocéntrico... aunque yo te quiero igual.' }, { quoted: msg })
    }

    await sock.sendMessage(from, { react: { text: '🧪', key: msg.key } })

    const porcentaje = Math.floor(Math.random() * 100)
    let comentario = ''
    let emojiFinal = '💔'

    if (porcentaje >= 85) {
      emojiFinal = '💖'
      comentario = random([
        '¡Almas gemelas! Están destinados a estar juntos, ¿para cuándo la boda?',
        '¡Qué viva el amor! Cupido hizo un trabajo perfecto con ustedes.',
        'Están tan conectados que asustan. Ya cásense por favor.',
        'Hay un hilo rojo gigante amarrándolos. No intenten escapar.',
        'El nivel de cursilería aquí supera los límites permitidos. ¡Me encanta!',
        'Son el uno para el otro, hacen una pareja hermosa.',
        'Búsquense ya mismo, el destino no se equivoca con estos números.',
        'Ustedes dos juntos incendian el chat, pura química.',
        'Nacieron para encontrarse en esta vida. No se suelten.',
        'Tienen un amor de película, de esos que duran para siempre.',
      ])
    } else if (porcentaje >= 50) {
      emojiFinal = '😳'
      comentario = random([
        'Hay química real aquí, un empujoncito más y caen redondos.',
        'No jueguen al inocente, ahí hay tensión y de la buena.',
        'Se gustan, pero les da miedo dar el primer paso. ¡Ya avienten la indirecta!',
        'Están a una salida al cine de volverse novios oficiales.',
        'El interés existe, solo falta que dejen el orgullo a un lado.',
        'Va por muy buen camino, hay chispas volando entre ustedes.',
        'Las intenciones son buenas, el amor está cocinándose a fuego lento.',
        'Hacen bonita pareja, solo necesitan hablarse un poquito más.',
        'Hay atracción mutua disimulada. Yo que tú, le mando un mensajito.',
        'Están en la línea delgada entre la amistad y algo más... ¿te atreves?',
      ])
    } else if (porcentaje >= 20) {
      emojiFinal = '🧸'
      comentario = random([
        'Uhmm... lo veo difícil, mejor queden como amigos por ahora.',
        'Hay cariño, pero del tipo "te quiero como hermano". Zona de amigos total.',
        'A veces sí, a veces no... están en un limbo medio raro.',
        'Sirven más para salir a comer y contar chismes que para romance.',
        'Alguien está remando en dulce de leche aquí... qué cansancio.',
        'Mucho texto y poca acción, la química se quedó a medias.',
        'Compatibilidad básica. Funciona para pasar el rato, pero no para boda.',
        'Uno de los dos quiere, el otro tiene la mente en otra parte.',
        'Es mejor no forzar las cosas, las mejores amistades empiezan así.',
        'El radar dice que hay peligro de quedar en la Friendzone permanente.',
      ])
    } else {
      emojiFinal = '🤡'
      comentario = random([
        'Zona de la amistad eterna... F por ese corazoncito.',
        'Ni con un amarre de bruja esto camina. Mejor busca por otro lado.',
        'El medidor dio negativo. Menos química que una piedra y una planta.',
        'Corran en direcciones opuestas, se ahorrarán mucho psicólogo.',
        'Compatibilidad nula. Creo que se equivocaron de persona.',
        'Fuerte rechazo en mis sensores amorosos. Soldado caído antes de empezar.',
        'Ahí no es, rey/reina. Date cuenta y retírate con dignidad.',
        'El único amor que hay aquí es el amor al arte... porque romance cero.',
        'Tienen la misma química que el agua y el fuego, se extinguen mutuamente.',
        'Mis cálculos sugieren que dejes de pasar vergüenza. Con cariño, Midori.',
      ])
    }

    const pasosCarga = [
      `❤️ Calculando... ${random(frases10)}`,
      `💗 ${random(frases40)}`,
      `💘 ${random(frases80)}`,
    ]

    const { key } = await sock.sendMessage(from, { text: pasosCarga[0] }, { quoted: msg })

    for (let i = 1; i < pasosCarga.length; i++) {
      await new Promise(r => setTimeout(r, 1500))
      await sock.sendMessage(from, { edit: key, text: pasosCarga[i] })
    }

    await new Promise(r => setTimeout(r, 1500))

    const txt = `💕 @${selfNum} y @${targetNum} tienen un *${porcentaje}%* de compatibilidad.\n> \n> _${comentario}_`

    await sock.sendMessage(from, { edit: key, text: txt, mentions: [selfJid, targetJid] })
    await sock.sendMessage(from, { react: { text: emojiFinal, key: msg.key } })
  }
}