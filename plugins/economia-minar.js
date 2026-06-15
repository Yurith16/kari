// plugins/eco-minar.js
import { getEconomy, addKryons, removeKryons, withdrawBanco, addXp, removeXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const exitos = [
  { texto: '⛏️ Te adentraste en la mina antigua y encontraste una veta brillante.', emoji: '⛏️', kryons: [200, 600], xp: [15, 30] },
  { texto: '💎 Picaste la roca correcta y una gema saltó a tus manos.', emoji: '💎', kryons: [300, 800], xp: [20, 35] },
  { texto: '🪨 La montaña te escupió kryons después de una hora de picar sin descanso.', emoji: '🪨', kryons: [250, 700], xp: [18, 32] },
  { texto: '🔦 Bajaste con linterna al túnel oscuro y volviste con los bolsillos llenos.', emoji: '🔦', kryons: [220, 650], xp: [16, 30] },
  { texto: '⚒️ El pico viejo del abuelo funcionó mejor de lo que esperabas.', emoji: '⚒️', kryons: [280, 750], xp: [20, 35] },
  { texto: '🪙 Encontraste monedas atrapadas entre las raíces del socavón.', emoji: '🪙', kryons: [180, 500], xp: [12, 25] },
  { texto: '🏔️ La montaña del norte fue generosa esta vez y te llevaste una buena carga.', emoji: '🏔️', kryons: [350, 900], xp: [25, 40] },
  { texto: '🧨 Usaste dinamita con cuidado y la explosión dejó kryons al descubierto.', emoji: '🧨', kryons: [400, 1000], xp: [28, 45] },
  { texto: '🪣 Cargaste la carretilla hasta el tope y Midori te ayuda a vaciarla.', emoji: '🪣', kryons: [260, 680], xp: [18, 32] },
  { texto: '🔎 Notaste un brillo entre las grietas y resultó ser una veta generosa.', emoji: '🔎', kryons: [320, 850], xp: [22, 38] },
  { texto: '⛰️ Escalaste hasta la entrada alta de la mina y valió cada paso.', emoji: '⛰️', kryons: [300, 780], xp: [20, 35] },
  { texto: '🪨 La roca madre soltó kryons después de un golpe seco y certero.', emoji: '💥', kryons: [240, 620], xp: [16, 28] },
  { texto: '🧭 Seguiste un mapa viejo del minero loco y el tesoro era real.', emoji: '🧭', kryons: [380, 950], xp: [25, 42] },
  { texto: '💧 Encontraste un río subterráneo y en sus orillas había kryons brillando.', emoji: '💧', kryons: [310, 820], xp: [22, 36] },
  { texto: '🦇 Los murciélagos te guiaron sin querer hasta la veta más rica de la cueva.', emoji: '🦇', kryons: [340, 880], xp: [24, 40] },
  { texto: '🕯️ Con un casco y vela te metiste al túnel prohibido y la suerte te acompañó.', emoji: '🕯️', kryons: [400, 1000], xp: [28, 45] },
  { texto: '🌋 Cerca del volcán dormido encontraste kryons petrificados listos para llevar.', emoji: '🌋', kryons: [360, 920], xp: [25, 42] },
  { texto: '🔨 El ritmo del pico atrajo la buena fortuna y la veta se abrió.', emoji: '🔨', kryons: [250, 650], xp: [16, 30] },
  { texto: '💠 Entre el cuarzo común encontraste kryons camuflados.', emoji: '💠', kryons: [290, 740], xp: [20, 34] },
  { texto: '💎 La cueva de cristal te recompensó por no rendirte en la búsqueda.', emoji: '💎', kryons: [420, 1050], xp: [30, 48] },
]

const nadas = [
  { texto: '🕳️ Cavaste y cavaste pero solo encontraste tierra y lombrices.', emoji: '🕳️' },
  { texto: '🪹 Dentro de la grieta solo había un nido de arañas vacío.', emoji: '🪹' },
  { texto: '🦴 Desenterraste un hueso viejo de animal, nada de valor.', emoji: '🦴' },
  { texto: '⛏️ El pico rebotó en piedra muerta, no había ni rastro de kryons.', emoji: '⛏️' },
  { texto: '🪨 Todas las rocas que partiste estaban huecas por dentro.', emoji: '🪨' },
  { texto: '🌫️ El túnel se llenó de polvo y no encontraste más que telarañas.', emoji: '🌫️' },
  { texto: '🦎 Solo apareció una lagartija dormida entre las piedras.', emoji: '🦎' },
  { texto: '💨 La veta prometía pero se acabó a los dos golpes de pico.', emoji: '💨' },
  { texto: '🪤 La cueva estaba vacía, alguien ya había pasado antes que vos.', emoji: '🪤' },
  { texto: '🍂 Solo cayó tierra seca del techo, ni un solo kryon.', emoji: '🍂' },
]

const fracasos = [
  { texto: '💥 Un derrumbe te agarró desprevenido y perdiste herramientas. Costó', emoji: '💥', multa: [200, 600], xpPierde: [8, 18] },
  { texto: '🪨 Una roca se desprendió del techo y te golpeó la espalda. Gastaste', emoji: '🪨', multa: [150, 500], xpPierde: [5, 15] },
  { texto: '⛏️ Se te quebró el pico a la mitad de la jornada y tuviste que comprar otro. Perdiste', emoji: '⛏️', multa: [180, 450], xpPierde: [8, 16] },
  { texto: '🦇 Los murciélagos se asustaron y en la huida perdiste tu bolsa de kryons. Volaste', emoji: '🦇', multa: [250, 700], xpPierde: [10, 20] },
  { texto: '💧 Pisaste un charco profundo y se te mojaron todos los kryons que llevabas. Perdiste', emoji: '💧', multa: [200, 550], xpPierde: [8, 18] },
  { texto: '🐍 Una serpiente te asustó y soltaste la carretilla colina abajo. Costó', emoji: '🐍', multa: [300, 800], xpPierde: [12, 22] },
  { texto: '🕸️ Te perdiste en una galería oscura y pagaste a un guía para salir. Gastaste', emoji: '🕸️', multa: [150, 400], xpPierde: [5, 15] },
  { texto: '🧨 La dinamita explotó antes de tiempo y casi te lleva una ceja. Perdiste', emoji: '🧨', multa: [350, 900], xpPierde: [15, 25] },
  { texto: '🪜 La escalera de cuerda se rompió y caíste sobre tu propio balde. Costó', emoji: '🪜', multa: [180, 480], xpPierde: [8, 18] },
  { texto: '🌌 Te adentraste tanto que olvidaste el camino de vuelta. Tuviste que pagar rescate. Perdiste', emoji: '🌌', multa: [400, 1000], xpPierde: [15, 28] },
]

export default {
  command: ['minar', 'mine', 'min'],
  tag: 'minar',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Mina kryons de las montañas de Midori',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'minar', 600)
    if (!cd.ok) {
      const mins = Math.ceil(cd.secsLeft / 60)
      return sock.sendMessage(from, {
        text: `🌸 Aún estás cansado de la última excavación. Vuelve en *${mins}* minuto(s).`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'minar')
    const eco = getEconomy(selfNum)
    const suerte = Math.random()

    // 50% éxito, 30% nada, 20% fracaso
    if (suerte < 0.50) {
      const exito = exitos[Math.floor(Math.random() * exitos.length)]
      const kryons = Math.floor(Math.random() * (exito.kryons[1] - exito.kryons[0] + 1)) + exito.kryons[0]
      const xp = Math.floor(Math.random() * (exito.xp[1] - exito.xp[0] + 1)) + exito.xp[0]

      addKryons(selfNum, kryons)
      addXp(selfNum, xp)

      await sock.sendMessage(from, { react: { text: exito.emoji, key: msg.key } })

      await sock.sendMessage(from, {
        text: `${exito.texto} Obtuviste *${kryons.toLocaleString()} kryons* y *${xp} de exp*.`
      }, { quoted: msg })

    } else if (suerte < 0.80) {
      const nada = nadas[Math.floor(Math.random() * nadas.length)]

      await sock.sendMessage(from, { react: { text: nada.emoji, key: msg.key } })

      await sock.sendMessage(from, {
        text: `${nada.texto} No encontraste nada esta vez.`
      }, { quoted: msg })

    } else {
      const fracaso = fracasos[Math.floor(Math.random() * fracasos.length)]
      const multa = Math.floor(Math.random() * (fracaso.multa[1] - fracaso.multa[0] + 1)) + fracaso.multa[0]
      const xpPierde = Math.floor(Math.random() * (fracaso.xpPierde[1] - fracaso.xpPierde[0] + 1)) + fracaso.xpPierde[0]

      const totalDisponible = eco.kryons + eco.banco
      if (totalDisponible < multa) {
        removeXp(selfNum, xpPierde)

        await sock.sendMessage(from, { react: { text: fracaso.emoji, key: msg.key } })

        return await sock.sendMessage(from, {
          text: `${fracaso.texto} *${multa.toLocaleString()} kryons*, pero no tenías con qué pagar. Perdiste *${xpPierde} de exp* y quedaste en deuda con la mina.`
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
        text: `${fracaso.texto} *${multa.toLocaleString()} kryons* y perdiste *${xpPierde} de exp*.`
      }, { quoted: msg })
    }
  }
}