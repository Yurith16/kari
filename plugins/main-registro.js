// plugins/registro.js
import { isRegistered, registerUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber }  from '../utils/jid.js'

const sesiones = new Map()

export default {
  command: ['registro', 'reg', 'registrar', 'register', 'verify', 'verificar'],
  tag: 'registro',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Crea tu perfil en el jardín de Midori',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return
    if (from.endsWith('@g.us')) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuestaOriginal = text?.trim()
    const respuesta = respuestaOriginal?.toLowerCase()
    if (!respuesta) return

    if (respuesta === 'cancelar') {
      sesiones.delete(userNum)
      return sock.sendMessage(from, { text: '🌸 Bueno, cuando quieras volvemos a intentarlo. Te esperaré pacientemente' }, { quoted: msg })
    }

    // Paso 1: nombre
    if (sesion.paso === 1) {
      if (respuestaOriginal.length < 2 || respuestaOriginal.length > 30) {
        return sock.sendMessage(from, { text: '🌸 El nombre debe tener entre 2 y 30 caracteres, ni tan corto ni tan largo.' }, { quoted: msg })
      }
      sesion.nombre = respuestaOriginal
      sesion.paso = 2
      return sock.sendMessage(from, { text: `🌸 ¡Qué bonito nombre, *${respuestaOriginal}*! ¿Cuántos años tienes?` }, { quoted: msg })
    }

    // Paso 2: edad
    if (sesion.paso === 2) {
      if (!/^\d+$/.test(respuesta)) return

      const edad = parseInt(respuesta)
      if (isNaN(edad) || edad < 10 || edad > 60) {
        return sock.sendMessage(from, { text: '🌸 Esa edad no me cuadra, debe ser entre 10 y 60 años. Intenta de nuevo.' }, { quoted: msg })
      }

      registerUser(userNum, { nombre: sesion.nombre, edad })
      sesiones.delete(userNum)

      return sock.sendMessage(from, {
        text: `🌸 ¡Bienvenida al jardín, *${sesion.nombre}*! Ya eres parte de Midori-Hana.\n\nUsa *setperfil* para completar tu perfil y dejarlo bien bonito.`
      }, { quoted: msg })
    }
  },

  async execute(sock, msg, { from, sender, isGroup }) {
    if (isGroup) {
      return sock.sendMessage(from, {
        text: '🌸 Para evitar el spam, mejor regístrate en mi privado. Te espero con los brazos abiertos.'
      }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: '🌸 Ya estás registrado(a) en el jardín. Puedes usar .setperfil para embellecer aún mas tu perfil.' }, { quoted: msg })
    }

    if (sesiones.has(selfNum)) {
      return sock.sendMessage(from, { text: '🌸 Ya tienes un registro en marcha. Responde o escribe *cancelar* para salir.' }, { quoted: msg })
    }

    sesiones.set(selfNum, { paso: 1 })

    await sock.sendMessage(from, {
      text: `🌸 ¡Hola! Voy a ayudarte a crear tu perfil en el jardín de Midori.\n\n¿Cuál es tu nombre?`
    }, { quoted: msg })
  }
}