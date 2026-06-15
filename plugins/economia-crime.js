// plugins/eco-crimen.js
import { getEconomy, addKryons, removeKryons, withdrawBanco, addXp, removeXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const exitos = [
  { texto: '🌸 Te hiciste el dormido en la boda de tu prima y vaciaste el sobre de los regalos.', emoji: '💒', kryons: [400, 900], xp: [15, 25] },
  { texto: '🍇 Robaste uvas del viñedo del abuelo y las vendiste como orgánicas en la feria.', emoji: '🍇', kryons: [250, 550], xp: [10, 18] },
  { texto: '📦 Encontraste una caja perdida del camión repartidor y resultó ser mercancía cara.', emoji: '📦', kryons: [500, 1100], xp: [18, 28] },
  { texto: '🎭 Te disfrazaste de inspector de sanidad y los puestos te dieron mordida.', emoji: '🎭', kryons: [350, 750], xp: [12, 22] },
  { texto: '🪙 Vendiste monedas antiguas que encontraste en el ático de tu bisabuela.', emoji: '🪙', kryons: [600, 1300], xp: [20, 30] },
  { texto: '🍯 Les vendiste miel casera a los turistas diciendo que era milagrosa.', emoji: '🍯', kryons: [300, 650], xp: [10, 20] },
  { texto: '🎣 Robaste pescado del muelle mientras el pescador echaba siesta bajo el árbol.', emoji: '🎣', kryons: [200, 450], xp: [8, 15] },
  { texto: '📿 Le vendiste pulseras de la suerte a los peregrinos del templo cercano.', emoji: '📿', kryons: [280, 580], xp: [10, 18] },
  { texto: '🌿 Recolectaste hierbas raras en el bosque y el boticario te pagó en secreto.', emoji: '🌿', kryons: [420, 880], xp: [15, 25] },
  { texto: '🎟️ Vendiste boletos falsos para el circo y nadie se dio cuenta hasta el final.', emoji: '🎟️', kryons: [380, 800], xp: [14, 24] },
  { texto: '🍄 Encontraste hongos exóticos tras la lluvia y los vendiste al chef del pueblo.', emoji: '🍄', kryons: [500, 1000], xp: [18, 28] },
  { texto: '📚 Robaste libros viejos de la biblioteca y los vendiste como reliquias.', emoji: '📚', kryons: [320, 700], xp: [12, 20] },
  { texto: '🕯️ Vendiste velas bendecidas falsas a los feligreses domingueros.', emoji: '🕯️', kryons: [180, 380], xp: [8, 14] },
  { texto: '🎨 Pintaste cuadros chuecos y los vendiste como arte moderno en la plaza.', emoji: '🎨', kryons: [450, 950], xp: [16, 26] },
  { texto: '🐓 Robaste gallinas del corral vecino y las vendiste al otro lado del río.', emoji: '🐓', kryons: [220, 480], xp: [10, 18] },
  { texto: '💐 Cortaste flores del parque público y armaste ramos para enamorados.', emoji: '💐', kryons: [150, 350], xp: [8, 15] },
  { texto: '🔮 Leíste la fortuna en la feria sin saber nada y te llovieron propinas.', emoji: '🔮', kryons: [400, 850], xp: [14, 24] },
  { texto: '🛒 Tomaste productos a punto de caducar y los revendiste puerta a puerta.', emoji: '🛒', kryons: [260, 550], xp: [10, 18] },
  { texto: '🎸 Tocaste la guitarra en el metro con sombrero ajeno y te llevaste las monedas.', emoji: '🎸', kryons: [180, 400], xp: [8, 14] },
  { texto: '🧁 Vendiste pastelitos en la salida del colegio sin permiso del director.', emoji: '🧁', kryons: [200, 420], xp: [10, 16] },
  { texto: '📸 Le tomaste fotos a los turistas con su propia cámara y les cobraste igual.', emoji: '📸', kryons: [150, 320], xp: [8, 14] },
  { texto: '🧵 Vendiste bufandas tejidas con lana robada de la mercería.', emoji: '🧵', kryons: [280, 580], xp: [12, 20] },
  { texto: '🪴 Robaste esquejes del vivero municipal y los vendiste como raros.', emoji: '🪴', kryons: [350, 720], xp: [14, 22] },
  { texto: '🎈 Inflaste globos con helio robado y los vendiste en el parque infantil.', emoji: '🎈', kryons: [160, 340], xp: [8, 14] },
  { texto: '🍿 Vendiste palomitas afuera del cine a mitad de precio del establecimiento.', emoji: '🍿', kryons: [200, 400], xp: [8, 14] },
  { texto: '🧴 Vendiste cremas milagrosas que hiciste en tu cocina con sábila y menta.', emoji: '🧴', kryons: [320, 680], xp: [12, 22] },
  { texto: '🪨 Pintaste piedras comunes y las vendiste como amuletos de la buena suerte.', emoji: '🪨', kryons: [180, 380], xp: [8, 14] },
  { texto: '👜 Le vendiste a una doña un bolso dizque de marca que hiciste a mano.', emoji: '👜', kryons: [500, 1050], xp: [16, 26] },
  { texto: '🎋 Robaste bambú del jardín botánico y lo vendiste para decoración zen.', emoji: '🎋', kryons: [280, 600], xp: [12, 20] },
  { texto: '🧃 Vendiste jugo de naranja como detox milagroso en el gimnasio del barrio.', emoji: '🧃', kryons: [180, 380], xp: [8, 15] },
]

const fracasos = [
  { texto: '👮‍♀️ Asaltaste a una señora mayor y la policía te atrapó en la esquina. Pagaste', emoji: '🚨', multa: [500, 1500], xpPierde: [10, 30] },
  { texto: '🔔 Intentaste robar en la tienda de la esquina y sonó la alarma. El dueño te tuvo una hora regañándote. Perdiste', emoji: '🔔', multa: [300, 800], xpPierde: [5, 15] },
  { texto: '📝 Te pillaron vendiendo exámenes falsos en la universidad y el rector te expulsó. Multa de', emoji: '📝', multa: [400, 1000], xpPierde: [8, 20] },
  { texto: '⛓️ Quisiste sobornar al guardia del mercado y te metió al calabozo sin preguntar. Costó', emoji: '⛓️', multa: [600, 1200], xpPierde: [15, 25] },
  { texto: '🐄 Robaste ganado del establo y el granjero te correteó con la escopeta de sal. Perdiste', emoji: '🐄', multa: [200, 600], xpPierde: [5, 12] },
  { texto: '🕵️ Te hiciste pasar por inspector de gas y la dueña llamó a la central. Pagaste', emoji: '🕵️', multa: [500, 1000], xpPierde: [10, 20] },
  { texto: '⛪ Intentaste vaciar la alcancía de la iglesia y el padre te agarró del brazo. El sermón fue eterno. Pagaste', emoji: '⛪', multa: [300, 700], xpPierde: [8, 18] },
  { texto: '🐱 Vendiste gatos por liebres y los compradores volvieron con antorcha y palos. Devolviste', emoji: '🐱', multa: [400, 900], xpPierde: [10, 22] },
  { texto: '🎬 Te colaste en el cine por la salida de emergencia y te sacaron a escobazos. Multa de', emoji: '🎬', multa: [100, 300], xpPierde: [3, 10] },
  { texto: '🍽️ Fingiste ser mesero en el restaurante elegante y te llevaste las propinas. El chef te cacheteó. Perdiste', emoji: '🍽️', multa: [250, 550], xpPierde: [5, 15] },
  { texto: '🐕 Robaste un perro de raza del jardín y resultó ser del alcalde. La fianza te dejó seco. Costó', emoji: '🐕', multa: [800, 2000], xpPierde: [20, 35] },
  { texto: '⚒️ Trataste de estafar al herrero con monedas falsas y te dio con el martillo en el dedo. Perdiste', emoji: '⚒️', multa: [350, 750], xpPierde: [8, 18] },
  { texto: '🚌 Intentaste colarte en el autobús sin pagar y el chófer te bajó en medio de la nada. Perdiste', emoji: '🚌', multa: [150, 350], xpPierde: [5, 12] },
  { texto: '📺 Vendiste un televisor que no servía y el comprador te fue a buscar a tu casa. Devolviste', emoji: '📺', multa: [450, 950], xpPierde: [12, 22] },
  { texto: '🍷 Trataste de vender vino casero sin licencia y te cayó sanidad. Multa de', emoji: '🍷', multa: [350, 800], xpPierde: [10, 20] },
  { texto: '🎰 Jugaste a las maquinitas con monedas marcadas y el dueño del bar te fichó. Perdiste', emoji: '🎰', multa: [300, 700], xpPierde: [8, 18] },
  { texto: '✂️ Robaste tela de la sastrería y la modista te reconoció por el patrón. Pagaste', emoji: '✂️', multa: [200, 500], xpPierde: [8, 15] },
  { texto: '🚲 Tomaste prestada una bici sin permiso y el dueño te persiguió tres cuadras. Multa de', emoji: '🚲', multa: [200, 450], xpPierde: [5, 14] },
  { texto: '📞 Hiciste llamadas de broma a la comisaría y te rastrearon el número. Pagaste', emoji: '📞', multa: [250, 600], xpPierde: [8, 18] },
  { texto: '🧪 Vendiste perfume pirata en la calle y una señora quedó intoxicada. Te demandó. Perdiste', emoji: '🧪', multa: [500, 1100], xpPierde: [14, 24] },
  { texto: '🗝️ Intentaste abrir un candado ajeno con ganzúa y el vecino justo salía a pasear al perro. Costó', emoji: '🗝️', multa: [300, 750], xpPierde: [10, 20] },
  { texto: '🎤 Cantaste en la calle con amplificador robado y la policía te confiscó todo. Perdiste', emoji: '🎤', multa: [280, 600], xpPierde: [8, 18] },
  { texto: '🧺 Robaste ropa tendida del patio ajeno y la dueña te reconoció por los calcetines. Pagaste', emoji: '🧺', multa: [180, 380], xpPierde: [5, 12] },
  { texto: '🛵 Te hiciste pasar por delivery y te llevaste comida ajena. El verdadero repartidor te delató. Costó', emoji: '🛵', multa: [320, 700], xpPierde: [10, 20] },
  { texto: '🕶️ Vendiste lentes de sol piratas en la playa y un turista se quemó los ojos. Te metieron preso. Perdiste', emoji: '🕶️', multa: [600, 1300], xpPierde: [18, 28] },
  { texto: '📡 Robaste el cable de la antena comunal y dejaste sin tele a todo el barrio. Te lincharon. Pagaste', emoji: '📡', multa: [400, 900], xpPierde: [12, 22] },
]

export default {
  command: ['crimen', 'crime'],
  tag: 'crimen',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Comete un crimen y arriésgate a ganar o perder',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'crimen', 900)
    if (!cd.ok) {
      const mins = Math.ceil(cd.secsLeft / 60)
      return sock.sendMessage(from, {
        text: `> 🌸 La policía aún ronda por ahí. Vuelve en *${mins}* minuto(s).`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'crimen')
    const eco = getEconomy(selfNum)
    const suerte = Math.random() < 0.45

    if (suerte) {
      const exito = exitos[Math.floor(Math.random() * exitos.length)]
      const kryons = Math.floor(Math.random() * (exito.kryons[1] - exito.kryons[0] + 1)) + exito.kryons[0]
      const xp = Math.floor(Math.random() * (exito.xp[1] - exito.xp[0] + 1)) + exito.xp[0]

      addKryons(selfNum, kryons)
      addXp(selfNum, xp)

      await sock.sendMessage(from, { react: { text: exito.emoji, key: msg.key } })

      await sock.sendMessage(from, {
        text: `> ${exito.texto} Obtuviste *${kryons.toLocaleString()} kryons* y *${xp} de exp*.`
      }, { quoted: msg })
    } else {
      const fracaso = fracasos[Math.floor(Math.random() * fracasos.length)]
      const multa = Math.floor(Math.random() * (fracaso.multa[1] - fracaso.multa[0] + 1)) + fracaso.multa[0]
      const xpPierde = Math.floor(Math.random() * (fracaso.xpPierde[1] - fracaso.xpPierde[0] + 1)) + fracaso.xpPierde[0]

      const totalDisponible = eco.kryons + eco.banco
      if (totalDisponible < multa) {
        removeXp(selfNum, xpPierde)

        await sock.sendMessage(from, { react: { text: fracaso.emoji, key: msg.key } })

        return sock.sendMessage(from, {
          text: `> ${fracaso.texto} *${multa.toLocaleString()} kryons*, pero no tenías ni para la fianza. Fuiste a la cárcel y perdiste *${xpPierde} de exp*.`
        }, { quoted: msg })
      }

      let restanteMulta = multa
      if (eco.kryons >= restanteMulta) {
        removeKryons(selfNum, restanteMulta)
      } else {
        restanteMulta -= eco.kryons
        removeKryons(selfNum, eco.kryons)
        if (restanteMulta > 0) withdrawBanco(selfNum, restanteMulta)
      }

      removeXp(selfNum, xpPierde)

      await sock.sendMessage(from, { react: { text: fracaso.emoji, key: msg.key } })

      await sock.sendMessage(from, {
        text: `> ${fracaso.texto} *${multa.toLocaleString()} kryons* y perdiste *${xpPierde} de exp*.`
      }, { quoted: msg })
    }
  }
}