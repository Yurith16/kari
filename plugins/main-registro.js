import { isRegistered, registerUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber }  from '../utils/jid.js'

const sesiones = new Map()

export default {
  command:     ['registro', 'reg', 'registrar', 'register', 'registrer', 'verify', 'verificar'],
  tag:         'registro',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Crea tu perfil en Midori-Hana',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (respuesta.toLowerCase() === 'cancelar') {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: global.messages?.registroCanceled || '🌸 Registro cancelado.' }, { quoted: msg })
      return
    }

    // Paso 1: nombre (texto libre)
    if (sesion.paso === 1) {
      if (respuesta.length < 2 || respuesta.length > 30) {
        await sock.sendMessage(from, {
          text: '🌸 El nombre debe tener entre 2 y 30 caracteres. Intenta de nuevo.'
        }, { quoted: msg })
        return
      }
      sesion.nombre = respuesta
      sesion.paso   = 2
      await sock.sendMessage(from, {
        text: `🌿 Hola, *${respuesta}*! ¿Cuántos años tienes? (10-60)`
      }, { quoted: msg })
      return
    }

    // Paso 2: edad (solo números, ignorar silenciosamente si no es número)
    if (sesion.paso === 2) {
      if (!/^\d+$/.test(respuesta)) return

      const edad = parseInt(respuesta)
      if (isNaN(edad) || edad < 10 || edad > 60) {
        await sock.sendMessage(from, {
          text: global.messages?.edadInvalida || '🌸 Edad inválida. Debe ser un número entre 10 y 60.'
        }, { quoted: msg })
        return
      }

      registerUser(userNum, { nombre: sesion.nombre, edad })
      sesiones.delete(userNum)

      const msgOk = global.messages?.registroOk || '✅ Registro completado, {nombre}'
      await sock.sendMessage(from, {
        text: msgOk.replace('{nombre}', sesion.nombre) + `\n\n🌸 Ya puedes usar todos los comandos. Usa *setperfil* para completar tu perfil.`
      }, { quoted: msg })
    }
  },

  async execute(sock, msg, { from, userNum }) {
    if (isRegistered(userNum)) {
      await sock.sendMessage(from, { text: global.messages?.registroYa || '🌸 Ya estás registrado.' }, { quoted: msg })
      return
    }

    if (sesiones.has(userNum)) {
      await sock.sendMessage(from, {
        text: '🌸 Ya tienes un registro en proceso. Responde o escribe *cancelar*.'
      }, { quoted: msg })
      return
    }

    sesiones.set(userNum, { paso: 1 })

    await sock.sendMessage(from, {
      text: `🌿 ¡Hola! Voy a ayudarte a crear tu perfil en *${global.bot?.name || 'Midori-Hana'}*.\n\n` +
        `Escribe *cancelar* para detener el proceso.\n\n` +
        `🌸 ¿Cuál es tu nombre?`
    }, { quoted: msg })
  }
}