// plugins/eco-robar.js
import { getUser, getEconomy, addKryons, removeKryons, addXp, setUltimo, getUltimo } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'
import { ROBAR } from '../settings/economia.js'

const RESPUESTAS_EXITO = [
  'Le sacaste *{amt}* kryons a *{objetivo}* sin que se diera cuenta. Qué habilidad tan cuestionable.',
  'Mano rápida, bolsillo lleno. Le robaste *{amt}* kryons a *{objetivo}*.',
  '*{objetivo}* va a notar que le faltan *{amt}* kryons, pero para entonces ya será tarde.',
  'Entraste, tomaste *{amt}* kryons de *{objetivo}* y saliste como si nada. Impresionante.',
  'Le aligeraste la cartera a *{objetivo}* en *{amt}* kryons. Ni lo vio venir.',
  '*{amt}* kryons menos para *{objetivo}* y más para ti. Así funciona esto.',
  'El robo salió perfecto. *{objetivo}* perdió *{amt}* kryons y tú los ganaste.',
  'Rápido y sin dejar rastros. *{amt}* kryons de *{objetivo}* ahora son tuyos.',
  '*{objetivo}* debería guardar mejor sus kryons. Le tomaste *{amt}* sin problema.',
  'Saliste con *{amt}* kryons de *{objetivo}* y la conciencia que ya tenías. Bien hecho.',
  'Le robaste *{amt}* kryons a *{objetivo}*. No está bien, pero tampoco está mal para tu cartera.',
  'El plan funcionó. *{amt}* kryons de *{objetivo}* ahora son tuyos.',
  '*{objetivo}* no estaba prestando atención y le costó *{amt}* kryons.',
  'Silencioso y efectivo. *{amt}* kryons de *{objetivo}* en tu bolsillo.',
  'El robo del día rindió *{amt}* kryons. *{objetivo}* va a estar molesto, pero qué se le va a hacer.',
  'Tomaste *{amt}* kryons de *{objetivo}* antes de que pudiera reaccionar.',
  '*{objetivo}* debería haber depositado en el banco. Le salió caro no hacerlo — *{amt}* kryons.',
  'Entraste y saliste con *{amt}* kryons de *{objetivo}*. Ni tiempo tuvo de parpadear.',
  'Le quitaste *{amt}* kryons a *{objetivo}* sin dramas. Eso se llama eficiencia.',
  'El robo de hoy fue limpio. *{amt}* kryons de *{objetivo}* y sin consecuencias.',
  '*{amt}* kryons que eran de *{objetivo}* y ahora son tuyos. La vida es así a veces.',
  'Ni lo sintió. *{amt}* kryons de *{objetivo}* en tu cartera.',
  'Le sacaste *{amt}* kryons a *{objetivo}* con una facilidad que da qué pensar.',
  'El robo salió bien esta vez. *{amt}* kryons de *{objetivo}* son tuyos ahora.',
  '*{objetivo}* va a revisar su cartera y no va a entender qué pasó. Tú sí sabes — *{amt}* kryons.',
]

const RESPUESTAS_FALLO = [
  'Te atraparon intentando robarle a *{objetivo}*. Perdiste *{pen}* kryons de penalización.',
  '*{objetivo}* te vio venir desde lejos. Perdiste *{pen}* kryons por el intento.',
  'El robo falló y encima te cobraron. *{pen}* kryons menos en tu cartera.',
  '*{objetivo}* tenía los ojos bien abiertos hoy. Perdiste *{pen}* kryons.',
  'No era tu día para robar. *{pen}* kryons de consecuencia.',
  'Te delataste antes de empezar. *{pen}* kryons de penalización.',
  '*{objetivo}* te cachó con las manos en la masa. *{pen}* kryons menos.',
  'El plan tenía demasiados huecos y *{objetivo}* los encontró todos. *{pen}* kryons.',
  'Fallaste y *{objetivo}* se fue tranquilo con sus kryons intactos. Tú perdiste *{pen}*.',
  'No fue tu mejor momento. *{pen}* kryons de lección aprendida.',
  'Te vieron desde el principio y dejaron que te hundieras solo. *{pen}* kryons.',
  '*{objetivo}* te esperaba. Perdiste *{pen}* kryons por confiarte.',
  'El intento fue valiente, el resultado no tanto. *{pen}* kryons menos.',
  'Fallaste en el momento menos indicado. *{pen}* kryons de castigo.',
  'Te atraparon antes de llegar a la cartera de *{objetivo}*. *{pen}* kryons perdidos.',
  'No todo robo sale bien, este es el ejemplo. *{pen}* kryons de penalización.',
  '*{objetivo}* tiene mejor suerte que tú hoy. Perdiste *{pen}* kryons.',
  'Salió mal desde el principio y costó *{pen}* kryons descubrirlo.',
  'Te cacharon y lo peor es que ni fue difícil. *{pen}* kryons de consecuencia.',
  'El robo falló y encima quedaste en ridículo. *{pen}* kryons menos.',
  'Confiaste demasiado en tu suerte y *{objetivo}* te lo cobró. *{pen}* kryons.',
  'Fallaste y punto. *{pen}* kryons de penalización sin más vueltas.',
  '*{objetivo}* estaba listo para esto. Tú no. *{pen}* kryons perdidos.',
  'No era el plan más brillante y los resultados lo confirman. *{pen}* kryons.',
  'Te atraparon con una facilidad que da qué pensar. *{pen}* kryons de castigo.',
]

const COOLDOWN_MSGS = [
  'Acabas de intentar robar, espera un poco antes del siguiente intento. Vuelve en *{tiempo}*.',
  'Todavía estás en el radar. Espera *{tiempo}* antes de volver a intentarlo.',
  'No puedes robar sin parar, eso levanta sospechas. Faltan *{tiempo}*.',
  'Date un tiempo entre un robo y otro. Quedan *{tiempo}*.',
  'El siguiente intento está disponible en *{tiempo}*. Mientras tanto, compórtate.',
]

let indiceExito = 0
let indiceFallo = 0

function tiempoRestante(secsLeft) {
  if (secsLeft >= 60) {
    const mins = Math.ceil(secsLeft / 60)
    return `${mins} minuto${mins > 1 ? 's' : ''}`
  }
  return `${secsLeft} segundo${secsLeft > 1 ? 's' : ''}`
}

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default {
  command:     ['robar', 'rob', 'steal'],
  tag:         'robar',
  categoria:   'economia',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Intenta robarle kryons a otro usuario',

  async execute(sock, msg, { from, sender, args, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid  = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum  = cleanNumber(selfJid)

    // Resolver objetivo
    const target = await resolveTarget(sock, msg, args).catch(() => null)
    if (!target?.num) {
  return sock.sendMessage(from, {
    text: 'No sé a quién quieres robarle. Etiqueta a alguien o responde su mensaje, que yo no adivino.'
  }, { quoted: msg })
}

const targetNum = target.num

if (targetNum === selfNum) {
  return sock.sendMessage(from, {
    text: 'Robarte a ti mismo es lo más absurdo que he visto hoy. Y eso ya es decir algo.'
  }, { quoted: msg })
}

const targetPerfil = getUser(targetNum)
if (!targetPerfil) {
  return sock.sendMessage(from, {
    text: 'Ese ni siquiera tiene perfil conmigo. No puedes robarle a un fantasma.'
  }, { quoted: msg })
}

const targetEco = getEconomy(targetNum)
if (!targetEco || targetEco.kryons <= 0) {
  return sock.sendMessage(from, {
    text: `*${targetPerfil.nombre}* está más pelado que tú. No hay nada que robarle ahí.`
  }, { quoted: msg })
}

    // Cooldown
    const ahora    = Math.floor(Date.now() / 1000)
    const ultimo   = getUltimo(selfNum, 'ultimo_robo')
    const secsLeft = ROBAR.cooldown - (ahora - ultimo)

    if (secsLeft > 0) {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })
      return sock.sendMessage(from, {
        text: elegir(COOLDOWN_MSGS).replace('{tiempo}', tiempoRestante(secsLeft))
      }, { quoted: msg })
    }

    setUltimo(selfNum, 'ultimo_robo', ahora)

    // 50% probabilidad de éxito
    const exito = Math.random() < 0.5

    if (exito) {
      // Robar entre minPct y maxPct de los kryons del objetivo
      const pct = Math.floor(Math.random() * (ROBAR.maxPct - ROBAR.minPct + 1)) + ROBAR.minPct
      const amt = Math.max(1, Math.floor(targetEco.kryons * pct / 100))

      removeKryons(targetNum, amt)
      addKryons(selfNum, amt)
      addXp(selfNum, ROBAR.xp)

      const texto = RESPUESTAS_EXITO[indiceExito % RESPUESTAS_EXITO.length]
        .replace('{amt}', amt.toLocaleString())
        .replace('{objetivo}', targetPerfil.nombre)
      indiceExito++

      await sock.sendMessage(from, { react: { text: '🦹', key: msg.key } })
      await sock.sendMessage(from, { text: texto }, { quoted: msg })
    } else {
      removeKryons(selfNum, ROBAR.penalidad)

      const texto = RESPUESTAS_FALLO[indiceFallo % RESPUESTAS_FALLO.length]
        .replace('{pen}', ROBAR.penalidad.toLocaleString())
        .replace('{objetivo}', targetPerfil.nombre)
      indiceFallo++

      await sock.sendMessage(from, { react: { text: '🚔', key: msg.key } })
      await sock.sendMessage(from, { text: texto }, { quoted: msg })
    }
  }
}