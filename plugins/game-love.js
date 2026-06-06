// plugins/amor.js
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

// Función para obtener un elemento aleatorio de un array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

export default {
  command:     ['love', 'amor'],
  tag:         'amor',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Calcula el porcentaje de amor con alguien',

  async execute(sock, msg, { from, args, sender }) {
    const target = await resolveTarget(sock, msg, args).catch(() => null)
    
    if (!target?.num) {
      return sock.sendMessage(from, { text: '🌸 Menciona o responde al mensaje de alguien para medir su amor. 🤭' }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)
    const targetNum = target.num

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: '🌸 ¿Medir el amor contigo mismo? Qué egocéntrico... aunque yo te quiero. 🥰' }, { quoted: msg })
    }

    // Reacción inicial en el mensaje del usuario
    await sock.sendMessage(from, { react: { text: '🧪', key: msg.key } })

    // --- BANCO DE FRASES PARA LAS ETAPAS DE CARGA (20 por cada una) ---
    const frases10 = [
      'Analizando miradas cruzadas... 👀', 'Revisando chats archivados... 🕵️‍♀️', 'Buscando indirectas en los estados... 📝',
      'Contando las veces que se dejaron en visto... 📱', 'Midiendo la tensión en el grupo... ⚡', 'Interceptando telepatía amorosa... 🧠',
      'Extrayendo capturas de pantalla secretas... 📸', 'Evaluando el primer "hola"... 👋', 'Espiando reacciones en fotos antiguas... 😏',
      'Desenterrando indirectas de Twitter... 🐦', 'Analizando stickers sospechosos... 🦊', 'Calculando el delay al responder... ⏱️',
      'Pesando el nivel de timidez mutua... 🙈', 'Buscando coincidencias en Spotify... 🎵', 'Revisando si se tienen en mejores amigos... ⭐',
      'Rastreando likes a altas horas de la noche... 🔥', 'Midiendo el pulso de los nervios... 💓', 'Abriendo el expediente de San Valentín... 💘',
      'Checando si hay bloqueos mutuos... 🚫', 'Iniciando el detector de sonrisas tontas... ✨'
    ]

    const frases40 = [
      'Midiendo los latidos del corazón... 💓', 'Calculando celos mal disimulados... 🧐', 'Analizando el tono de las notas de voz... 🎙️',
      'Contando los emojis de corazones usados... ❤️', 'Evaluando el nivel de coqueteo sutil... 💋', 'Sumando las risas compartidas... 😂',
      'Descifrando miradas en la vida real... 😳', 'Sincronizando suspiros secretos... 💨', 'Revisando el historial de apodos cursis... 🧸',
      'Midiendo la velocidad de los tecleos... ⌨️', 'Analizando indirectas muy directas... 🎯', 'Calculando la proximidad física... 📏',
      'Buscando sonrojos accidentales... 🫣', 'Rastreando promesas a las 3 AM... 🌙', 'Evaluando la química corporal... 🧬',
      'Checando compatibilidad de signos zodiacales... 🔮', 'Sopesando el orgullo de ambos... 🧩', 'Detectando mariposas en el estómago... 🦋',
      'Midiendo las ganas de verse... 🚗', 'Contando los pensamientos compartidos... 💭'
    ]

    const frases80 = [
      'Preparando el veredicto final... 😳', 'Cruzando datos con el destino... 🌌', 'Consultando al Oráculo de Midori... 🔮',
      'Afilando las flechas de Cupido... 🏹', 'Sellando los resultados químicos... 🧪', 'Ajustando los niveles de romanticismo... 🌹',
      'Debatiendo si habrá drama o boda... 🎭', 'Calculando la resistencia al casamiento... 💍', 'Confirmando si es amor o capricho... 🌪️',
      'Verificando si hay corazones rotos en camino... 💔', 'Asegurando las mariposas para que no escapen... 🦋', 'Anotando las conclusiones del chisme... 📝',
      'Evaluando si les compro un boleto al cine... 🎟️', 'Confirmando sospechas románticas... 🕵️‍♀️', 'Alineando los planetas a su favor... 🪐',
      'Midiendo la fuerza de atracción final... 🧲', 'Imprimiendo el certificado de compatibilidad... 🖨️', 'Preparando los pañuelos por si acaso... 🤧',
      'Alistando las campanas de la iglesia... 🔔', 'Haciendo los últimos amarres... ✨'
    ]

    // --- BANCO DE MENSAJES FINALES (20 por cada rango) ---
    const porcentaje = Math.floor(Math.random() * 100)
    let comentario = ''
    let emojiFinal = '💔'
    
    if (porcentaje >= 85) {
      emojiFinal = '💖'
      comentario = random([
        '¡Almas gemelas! Están destinados a estar juntos, ¿para cuándo la boda? 💍✨',
        '¡Qué viva el amor! Cupido hizo un trabajo perfecto con ustedes. 💕',
        'Están tan conectados que asustan. Ya cásense por favor. 😳❤️',
        'Hay un hilo rojo gigante amarrándolos. No intenten escapar. 🧵✨',
        'El nivel de cursilería aquí supera los límites permitidos. ¡Me encanta! 🥰',
        'Son el uno para el otro, hacen una pareja hermosa. 🌸',
        'Búsquense ya mismo, el destino no se equivoca con estos números. 🚀',
        'Ustedes dos juntos incendian el chat, pura química pura. 🔥',
        'Nacieron para encontrarse en esta vida. No se suelten. ✨',
        'Tienen un amor de película, de esos que duran para siempre. 🎬❤️',
        'Es oficial: son la envidia de todos los solteros del grupo. 💖',
        'Su compatibilidad es perfecta. Ya huelo el pastel de bodas. 🎂',
        'Exceso de romance detectado, me va a dar diabetes de tanta ternura. 🍬',
        'Hacen un match perfecto, de esos que solo pasan una vez en la vida. 🌟',
        'El amor real existe y ustedes dos son la prueba viviente. 🥰',
        'Tienen el futuro asegurado juntos, quédate con quien te mire así. 🧿',
        'La combinación más hermosa que ha procesado mi sistema hoy. 🥺💕',
        'No fuercen nada, lo de ustedes ya estaba escrito en las estrellas. 🌌',
        'Un amor tan puro que hasta a mí me dan ganas de enamorarme. 🌸',
        'Son dinamita pura, el verdadero "juntos hasta el fin del mundo". 🌍✨'
      ])
    } else if (porcentaje >= 50) {
      emojiFinal = '😳'
      comentario = random([
        'Hay química real aquí, un empujoncito más y caen redondos. 🥰',
        'No jueguen al inocente, ahí hay tensión y de la buena. 😏',
        'Se gustan, pero les da miedo dar el primer paso. ¡Ya avienten la indirecta! 🎯',
        'Están a una salida al cine de volverse novios oficiales. 🍿',
        'El interés existe, solo falta que dejen el orgullo a un lado. 🧩',
        'Va por muy buen camino, hay chispas volando entre ustedes. ⚡',
        'Las intenciones son buenas, el amor está cocinándose a fuego lento. 🍳❤️',
        'Hacen bonita pareja, solo necesitan hablarse un poquito más. 💬',
        'Hay atracción mutua disimulada. Yo que tú, le mando un mensajito. 😉',
        'Están en la línea delgada entre la amistad y algo más... ¿te atreves? 🫣',
        'El medidor dice que se piensan bastante seguido. Te lo dejo ahí. 💭',
        'Tienen un potencial enorme, no dejen que se enfríe la cosa. 🔥',
        'A Midori le gusta esta combinación, dale una oportunidad. 🌸',
        'El ambiente se pone raro cuando se juntan, y ya sabemos por qué. 😳',
        'Tienen demasiadas cosas en común como para ser solo amigos. 🎵',
        'Se nota a kilómetros que se caen mejor de lo normal. 👀',
        'Hay un 50% de probabilidad de que terminen juntos y otro 50% de puro drama. 🎭',
        'Alguien sonríe cada vez que ve un mensaje del otro, no mientan. 🤭',
        'Están coqueteando con el destino, jueguen bien sus cartas. 🃏',
        'La química está aprobada por mis sensores, falta la acción. 🧪✨'
      ])
    } else if (porcentaje >= 20) {
      emojiFinal = '🧸'
      comentario = random([
        'Uhmm... lo veo difícil, mejor queden como amigos por ahora. 🤭',
        'Hay cariño, pero del tipo "te quiero como hermano". Zona de amigos total. 🧸',
        'La tensión que tienen es porque no se deciden o no se entienden. 🌀',
        'A veces sí, a veces no... están en un limbo medio raro. ⏳',
        'Sirven más para salir a comer y contar chismes que para romance. 🍔',
        'Alguien está remando en dulce de leche aquí... qué cansancio. 🚣‍♂️',
        'Mucho texto y poca acción, la química se quedó a medias. 📉',
        'Compatibilidad básica. Funciona para pasar el rato, pero no para boda. 🦄',
        'Uno de los dos quiere, el otro tiene la mente en otra parte. 🚂',
        'Son como el agua y el aceite, se quieren pero no se mezclan. 🧪',
        'Es mejor no forzar las cosas, las mejores amistades empiezan así. 👋',
        'El radar dice que hay peligro de quedar en la "Friendzone" permanente. 🚧',
        'Se llevan increíble, pero el romance no es su fuerte. ¡Disfruten la amistad! 🥳',
        'Van a un ritmo tan lento que me voy a quedar sin batería esperando. 🔋',
        'Hay un poquito de interés, pero falta chispa. Pónganle ganas. 🌶️',
        'El destino dice: intenten más tarde, por ahora dejen las cosas claras. 🛑',
        'No veo corazones en el horizonte, solo dos buenos panas riéndose. 🤷‍♂️',
        'Si insisten puede funcionar, pero prepárense para una montaña rusa. 🎢',
        'Alguien está esquivando las balas del amor con maestría. 🤺',
        'Química nivel: compañeros de proyecto escolar. Útil pero fría. 📚'
      ])
    } else {
      emojiFinal = '🤡'
      comentario = random([
        'Zona de la amistad eterna... F por ese corazoncito. 💔',
        'Ni con un amarre de bruja esto camina. Mejor busca por otro lado. 🔮❌',
        'El medidor dio negativo. Menos química que una piedra y una planta. 🌿',
        'Escondan el orgullo, porque aquí no hay ni el más mínimo interés. 🚪',
        'Corran en direcciones opuestas, se ahorrarán mucho psicólogo. 🏃‍♂️💨',
        'Compatibilidad nula. Creo que se equivocaron de persona. 🤡',
        'Fuerte rechazo en mis sensores amorosos. Soldado caído antes de empezar. 🪖',
        'Ahí no es, rey/reina. Date cuenta y retírate con dignidad. 👑',
        'El único amor que hay aquí es el amor al arte... porque romance cero. 🎨',
        'Tienen la misma química que el agua y el fuego, se extinguen mutua. 🌊🔥',
        'Mis cálculos sugieren que dejes de pasar vergüenza. Con cariño, Midori. 🤭',
        'Un minuto de silencio por las ilusiones que acaban de morir aquí. 🤫',
        'Están más distanciados emocionalmente que la Tierra de Plutón. 🪐',
        'No pierdas tu tiempo, guarda esos kryons para alguien que valga la pena. 🌿',
        'Te dejó en visto mentalmente antes de que terminaras de calcular. 📱❌',
        'Si el amor fuera ciego, con ustedes directamente no tiene ojos. 🕶️',
        'Mejor búscate un perrito, te dará más atención que esa persona. 🐶',
        'Bloqueo total de Cupido. Rompió su arco al ver estos números. 🏹💔',
        'Están en polos opuestos del universo romántico. Próximo objetivo... 🧭',
        'Veredicto oficial: Contacto cero y a seguir con la vida. ¡Ánimo! 🧼'
      ])
    }

    // Texto final sin títulos pesados ni estructuras rígidas
    let txt = `🌸 El medidor indica que @${selfNum} y @${targetNum} tienen un *${porcentaje}%* de compatibilidad amorosa.\n\n`
    txt += `_Midori piensa que: ${comentario}_`

    const mentions = [selfJid, `${targetNum}@s.whatsapp.net`]

    try {
      // Mensaje de carga inicial
      let { key } = await sock.sendMessage(from, { text: '🌸 Déjame calcular qué tanta química tienen... 🧪✨' }, { quoted: msg })
      
      // Selección aleatoria de la frase de cada fase para que nunca se repita el proceso de carga
      const pasosCarga = [
        `《 █▒▒▒▒▒▒▒▒▒▒▒》10% ... ${random(frases10)}`,
        `《 ████▒▒▒▒▒▒▒▒》40% ... ${random(frases40)}`,
        `《 ██████████▒▒》80% ... ${random(frases80)}`,
        '《 ████████████》100% ¡Listo!'
      ]

      // Bucle con tiempo prudencial (1.5 segundos) para disfrutar del chisme
      for (let i = 0; i < pasosCarga.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        await sock.sendMessage(from, { text: pasosCarga[i], edit: key })
      }

      // Edición del resultado definitivo final
      await new Promise(resolve => setTimeout(resolve, 800))
      await sock.sendMessage(from, { text: txt, edit: key, mentions })
      
      // Reacción final en el mensaje del usuario según el porcentaje obtenido
      await sock.sendMessage(from, { react: { text: emojiFinal, key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
      await sock.sendMessage(from, { react: { text: emojiFinal, key: msg.key } })
    }
  }
}