// plugins/crimen.js

import { getEconomy, addKryons, removeKryons, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 10 minutos

export default {
  command:     ['crimen', 'crime'],
  tag:         'crimen',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Comete un crimen arriesgado por kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'crimen', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌿 Tranquilo, fiera. Ya hiciste demasiadas locuras. Espera *${formatCooldown(cd.secsLeft)}* para volver a las sombras.`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'crimen')

    const exito = Math.random() < 0.45 // 45% de éxito

    if (exito) {
      const ganancia = Math.floor(Math.random() * 400) + 150 // 150-550 kryons
      addKryons(selfNum, ganancia)

      const frasesExito = [
        `💻 Hackeaste los sistemas de seguridad y desviaste *${ganancia.toLocaleString()}* kryons. Nadie vio tu rastro esmeralda.`,
        `🐍 Te escabulliste en la noche y robaste *${ganancia.toLocaleString()}* kryons con total sigilo.`,
        `🔫 Asaltaste la bóveda principal y lograste perderte en el bosque con *${ganancia.toLocaleString()}* kryons.`,
        `🧪 Vendiste toxinas experimentales en el mercado negro y te pagaron *${ganancia.toLocaleString()}* kryons.`,
        `💋 Seduciste a un millonario, le rompiste el corazón y huiste con *${ganancia.toLocaleString()}* kryons. Todo por amor al dinero.`,
        `🌿 Usaste tus enredaderas venenosas para paralizar a los guardias y llevarte *${ganancia.toLocaleString()}* kryons.`,
        `🎭 Te hiciste pasar por un líder de culto y tus fieles seguidores te ofrendaron *${ganancia.toLocaleString()}* kryons.`,
        `💍 Prometiste amor eterno, robaste el anillo de compromiso y lo empeñaste por *${ganancia.toLocaleString()}* kryons. Qué cruel.`,
        `🔋 Saboteaste la planta eléctrica de la ciudad y cobraste *${ganancia.toLocaleString()}* kryons por el rescate.`,
        `💌 Enviaste cartas de amor falsas con malware y extorsionaste a las víctimas por *${ganancia.toLocaleString()}* kryons.`,
        `🕸️ Tendiste una trampa en la deep web y pescaste *${ganancia.toLocaleString()}* kryons limpios.`,
        `🍷 Envenenaste la bebida del rey y cobraste *${ganancia.toLocaleString()}* kryons para darle el antídoto.`,
        `🚁 Secuestraste un dron de mensajería y te quedaste con un paquete que valía *${ganancia.toLocaleString()}* kryons.`,
        `🥀 Vendiste orquídeas negras de contrabando y ganaste *${ganancia.toLocaleString()}* kryons en efectivo.`,
        `💔 Chantajeaste a una pareja infiel con unas fotos secretas y te pagaron *${ganancia.toLocaleString()}* kryons por tu silencio.`,
        `🧬 Clonaste tarjetas de crédito VIP en un casino clandestino y retiraste *${ganancia.toLocaleString()}* kryons.`,
        `🏍️ Protagonizaste una persecución a alta velocidad y escapaste con un botín de *${ganancia.toLocaleString()}* kryons.`,
        `🥂 En una cita a ciegas, drogaste su bebida y vaciaste su billetera, obteniendo *${ganancia.toLocaleString()}* kryons.`,
        `🌲 Escondiste mercancía robada en el bosque de Midori y tu cliente te transfirió *${ganancia.toLocaleString()}* kryons.`,
        `👑 Falsificaste un testamento y heredaste *${ganancia.toLocaleString()}* kryons de alguien que ni conocías.`
      ]

      const mensajeElegido = frasesExito[Math.floor(Math.random() * frasesExito.length)]
      const emojiContexto = mensajeElegido.split(' ')[0] // Toma el primer emoji de la frase elegida

      await sock.sendMessage(from, { react: { text: emojiContexto, key: msg.key } })
      await sock.sendMessage(from, { text: `> ${mensajeElegido}` }, { quoted: msg })
      
    } else {
      const perdida = Math.floor(Math.random() * 200) + 80 // 80-280 kryons
      removeKryons(selfNum, perdida)

      const frasesFracaso = [
        `🚔 Las sirenas sonaron antes de tiempo y en la desesperación perdiste *${perdida.toLocaleString()}* kryons.`,
        `🥀 Caíste en una trampa enemiga y te despojaron de *${perdida.toLocaleString()}* kryons.`,
        `💔 La persona que amabas te entregó a la policía por la espalda. Perdiste *${perdida.toLocaleString()}* kryons de puro despecho.`,
        `🩹 Te lastimaste saltando un muro con espinas y tuviste que pagar *${perdida.toLocaleString()}* kryons en curarte.`,
        `🎥 Olvidaste apagar las cámaras de seguridad y pagaste *${perdida.toLocaleString()}* kryons en sobornos para borrar la cinta.`,
        `🌧️ La lluvia arruinó tu camuflaje, te descubrieron y soltaste *${perdida.toLocaleString()}* kryons al huir.`,
        `🍷 Te enamoraste de tu objetivo, no pudiste robarle y encima le invitaste la cena, perdiendo *${perdida.toLocaleString()}* kryons.`,
        `🐕 Unos perros guardianes te persiguieron y se comieron *${perdida.toLocaleString()}* kryons de tu bolsillo.`,
        `💣 El explosivo falló, te quemaste las cejas y la clínica te cobró *${perdida.toLocaleString()}* kryons.`,
        `💌 Tu amante te delató para quedarse con otro. Gastaste *${perdida.toLocaleString()}* kryons en abogados.`,
        `📉 Invertiste el botín en un plan de escape falso y perdiste *${perdida.toLocaleString()}* kryons en un segundo.`,
        `🕸️ Te enredaste en tus propias trampas en el bosque y perdiste *${perdida.toLocaleString()}* kryons buscando la salida.`,
        `🔫 Un ladrón más rápido que tú te asaltó mientras asaltabas. Te quitó *${perdida.toLocaleString()}* kryons. El colmo.`,
        `🧪 Se te rompió un frasco de toxinas en la mochila y echó a perder *${perdida.toLocaleString()}* kryons de tu reserva.`,
        `💍 Le ibas a robar, pero te propuso matrimonio. Huiste del susto y se te cayeron *${perdida.toLocaleString()}* kryons.`,
        `🚁 Tu dron de escape se quedó sin batería y se estrelló, costándote *${perdida.toLocaleString()}* kryons en reparaciones.`,
        `🔥 Intentaste quemar la evidencia pero quemaste *${perdida.toLocaleString()}* kryons por accidente.`,
        `🦇 Un murciélago te atacó en la noche y soltaste tu bolsa perdiendo *${perdida.toLocaleString()}* kryons.`,
        `🎭 Tu disfraz era tan malo que te cobraron una multa por alterar el orden, perdiendo *${perdida.toLocaleString()}* kryons.`,
        `😭 Lloraste recordando a tu ex en pleno atraco, te descubrieron y perdiste *${perdida.toLocaleString()}* kryons.`
      ]

      const mensajeElegido = frasesFracaso[Math.floor(Math.random() * frasesFracaso.length)]
      const emojiContexto = mensajeElegido.split(' ')[0] 

      await sock.sendMessage(from, { react: { text: emojiContexto, key: msg.key } })
      await sock.sendMessage(from, { text: `> ${mensajeElegido}` }, { quoted: msg })
    }
  }
}