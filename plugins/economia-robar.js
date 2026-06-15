// plugins/eco-robar.js
import { getEconomy, getUser, addKryons, removeKryons, withdrawBanco, addXp, removeXp, checkCooldown, setCooldown, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

const exitos = [
  { texto: '💰', contexto: 'se hizo el dormido y cuando', detalle: 'pasó le sacó', porcentaje: [15, 35], xp: [15, 30] },
  { texto: '🎭', contexto: 'se disfrazó de turista y apenas', detalle: 'se descuidó le birló', porcentaje: [18, 38], xp: [18, 32] },
  { texto: '😴', contexto: 'se durmió bajo el cerezo y', detalle: 'le vació los bolsillos. Le robó', porcentaje: [20, 40], xp: [20, 35] },
  { texto: '🫣', contexto: 'gritó "¡un conejito!" y cuando', detalle: 'volteó le metió mano. Le sacó', porcentaje: [15, 33], xp: [15, 28] },
  { texto: '🤝', contexto: 'le dio un abrazo y mientras', detalle: 'le revisaba los bolsillos. Le robó', porcentaje: [18, 36], xp: [16, 30] },
  { texto: '🏃', contexto: 'iba tranquilo y', detalle: 'pasó corriendo y le arrancó', porcentaje: [12, 30], xp: [12, 25] },
  { texto: '🤡', contexto: 'le dijo que traía algo en la oreja y', detalle: 'se tocaba le sacó', porcentaje: [18, 35], xp: [16, 30] },
  { texto: '😏', contexto: 'le pidió prestado y desapareció.', detalle: 'nunca le devolvió', porcentaje: [20, 45], xp: [20, 38] },
  { texto: '🫳', contexto: 'se le cayeron las monedas y', detalle: 'las barrió antes que nadie. Agarró', porcentaje: [14, 32], xp: [14, 28] },
  { texto: '🕺', contexto: 'se puso a bailar en la plaza y', detalle: 'miraba el show le robó', porcentaje: [16, 34], xp: [15, 30] },
]

const fracasos = [
  { texto: '🚔', contexto: 'iba a robarle pero pasó la patrulla.', detalle: 'Salió corriendo y perdió', porcentaje: [8, 20], xpPierde: [8, 18] },
  { texto: '😤', contexto: 'lo miró feo y le gritó de lejos.', detalle: 'Del susto se le cayeron', porcentaje: [10, 22], xpPierde: [10, 20] },
  { texto: '🐕', contexto: 'no sabía que cargaba un perro bravo.', detalle: 'Le mordió el tobillo y perdió', porcentaje: [8, 18], xpPierde: [8, 16] },
  { texto: '😳', contexto: 'era más pobre que él.', detalle: 'De la pena terminó regalándole', porcentaje: [5, 15], xpPierde: [5, 12] },
  { texto: '🫢', contexto: 'lo cacheó en el acto.', detalle: 'De la vergüenza devolvió todo y perdió', porcentaje: [8, 18], xpPierde: [8, 16] },
  { texto: '📢', contexto: 'gritó "¡ladrón!" y se asomó todo el barrio.', detalle: 'En la huida se le cayeron', porcentaje: [10, 20], xpPierde: [10, 18] },
  { texto: '😭', contexto: 'se puso a llorar en plena calle.', detalle: 'Sintió culpa y encima perdió', porcentaje: [5, 15], xpPierde: [5, 14] },
  { texto: '🪤', contexto: 'quiso ponerle zancadilla y se cayó él.', detalle: 'Quedó embarrado y perdió', porcentaje: [8, 18], xpPierde: [8, 16] },
  { texto: '🤬', contexto: 'lo agarró del cuello.', detalle: 'No lo soltó hasta que escupió', porcentaje: [12, 25], xpPierde: [12, 22] },
  { texto: '🧓', contexto: 'era viejito pero puro músculo.', detalle: 'Lo paseó de la oreja y perdió', porcentaje: [8, 20], xpPierde: [8, 18] },
]

export default {
  command: ['robar', 'rob', 'steal'],
  tag: 'robar',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Roba kryons a otro usuario del jardín',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, {
        text: '🤔 ¿Y a quién piensas robarle? Menciona a alguien o responde a su mensaje.'
      }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfNum === targetNum) {
      return sock.sendMessage(from, {
        text: '😵‍💫 ¿Robarte a vos mismo? Eso no tiene sentido...'
      }, { quoted: msg })
    }

    if (!isRegistered(targetNum)) {
      return sock.sendMessage(from, {
        text: '🌱 Esa persona aún no tiene jardín. No hay nada que robarle.'
      }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'robar', 600)
    if (!cd.ok) {
      const mins = Math.ceil(cd.secsLeft / 60)
      return sock.sendMessage(from, {
        text: `🕰️ Todavía andan preguntando por lo del último robo. Espera *${mins}* minuto(s).`
      }, { quoted: msg })
    }

    setCooldown(selfNum, 'robar')

    const ecoVictima = getEconomy(targetNum)
    if (ecoVictima.kryons < 100) {
      return sock.sendMessage(from, {
        text: '🫗 Esa persona no tiene ni para un café. Busca otra víctima.'
      }, { quoted: msg })
    }

    const suerte = Math.random()
    const perfilLadron = getUser(selfNum)
    const perfilVictima = getUser(targetNum)
    const nombreLadron = perfilLadron?.nombre || selfNum
    const nombreVictima = perfilVictima?.nombre || targetNum

    if (suerte < 0.45) {
      const exito = exitos[Math.floor(Math.random() * exitos.length)]
      const porcentaje = Math.floor(Math.random() * (exito.porcentaje[1] - exito.porcentaje[0] + 1)) + exito.porcentaje[0]
      const xp = Math.floor(Math.random() * (exito.xp[1] - exito.xp[0] + 1)) + exito.xp[0]

      const cantidad = Math.floor(ecoVictima.kryons * (porcentaje / 100))

      removeKryons(targetNum, cantidad)
      addKryons(selfNum, cantidad)
      addXp(selfNum, xp)

      await sock.sendMessage(from, { react: { text: exito.texto, key: msg.key } })

      await sock.sendMessage(from, {
        text: `${exito.texto} ${nombreLadron} ${exito.contexto} ${nombreVictima} ${exito.detalle} *${cantidad.toLocaleString()} kryons*. ¡Bien jugado!`,
        mentions: [target?.jid]
      }, { quoted: msg })

    } else {
      const fracaso = fracasos[Math.floor(Math.random() * fracasos.length)]
      const porcentaje = Math.floor(Math.random() * (fracaso.porcentaje[1] - fracaso.porcentaje[0] + 1)) + fracaso.porcentaje[0]
      const xpPierde = Math.floor(Math.random() * (fracaso.xpPierde[1] - fracaso.xpPierde[0] + 1)) + fracaso.xpPierde[0]

      const ecoLadron = getEconomy(selfNum)
      const multa = Math.floor(ecoLadron.kryons * (porcentaje / 100))

      const totalDisponible = ecoLadron.kryons + ecoLadron.banco
      if (totalDisponible <= 0 || multa <= 0) {
        removeXp(selfNum, xpPierde)

        await sock.sendMessage(from, { react: { text: fracaso.texto, key: msg.key } })

        return await sock.sendMessage(from, {
          text: `${fracaso.texto} ${nombreLadron} ${fracaso.contexto} ${nombreVictima} ${fracaso.detalle} kryons. ${nombreVictima} se rió en su cara. ¡Qué oso!`,
          mentions: [target?.jid]
        }, { quoted: msg })
      }

      let restanteMulta = multa
      if (ecoLadron.kryons >= restanteMulta) {
        removeKryons(selfNum, restanteMulta)
      } else {
        restanteMulta -= ecoLadron.kryons
        removeKryons(selfNum, ecoLadron.kryons)
        if (restanteMulta > 0) withdrawBanco(selfNum, restanteMulta)
      }

      removeXp(selfNum, xpPierde)

      await sock.sendMessage(from, { react: { text: fracaso.texto, key: msg.key } })

      await sock.sendMessage(from, {
        text: `${fracaso.texto} ${nombreLadron} ${fracaso.contexto} ${nombreVictima} ${fracaso.detalle} *${multa.toLocaleString()} kryons*. ¡Papelón!`,
        mentions: [target?.jid]
      }, { quoted: msg })
    }
  }
}