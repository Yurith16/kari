import { isRegistered, registerUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber }  from '../utils/jid.js'

const sesiones = new Map()

const GENEROS = ['hombre', 'mujer', 'prefiero no decir']
const PAISES  = ['Honduras', 'México', 'Guatemala', 'El Salvador', 'Nicaragua',
                 'Costa Rica', 'Panamá', 'Colombia', 'Venezuela', 'Argentina',
                 'Chile', 'Perú', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay',
                 'España', 'Estados Unidos', 'Otro']

export default {
  command:     'registro',
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

    // Cancelar registro
    if (respuesta.toLowerCase() === 'cancelar') {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: global.messages?.registroCanceled || '🌸 Registro cancelado.' }, { quoted: msg })
      return
    }

    const { paso } = sesion

    // ─── Paso 1: Nombre ──────────────────────────────────────────────────────
    if (paso === 1) {
      if (respuesta.length < 2 || respuesta.length > 30) {
        await sock.sendMessage(from, {
          text: '🌸 El nombre debe tener entre 2 y 30 caracteres. Intenta de nuevo.'
        }, { quoted: msg })
        return
      }
      sesion.nombre = respuesta
      sesion.paso   = 2
      await sock.sendMessage(from, {
        text: `🌿 Perfecto, *${respuesta}*. Ahora dime tu apodo o nickname.\n\n_Escribe *saltar* si prefieres no tener apodo._`
      }, { quoted: msg })
      return
    }

    // ─── Paso 2: Apodo ───────────────────────────────────────────────────────
    if (paso === 2) {
      sesion.apodo = respuesta.toLowerCase() === 'saltar' ? '' : respuesta.slice(0, 25)
      sesion.paso  = 3
      await sock.sendMessage(from, {
        text: `🌸 Entendido. ¿Cuántos años tienes? (10-60)`
      }, { quoted: msg })
      return
    }

    // ─── Paso 3: Edad ────────────────────────────────────────────────────────
    if (paso === 3) {
      const edad = parseInt(respuesta)
      if (isNaN(edad) || edad < 10 || edad > 60) {
        await sock.sendMessage(from, { text: global.messages?.edadInvalida || '🌸 Edad inválida. Debe ser entre 10 y 60.' }, { quoted: msg })
        return
      }
      sesion.edad = edad
      sesion.paso = 4
      const lista = GENEROS.map((g, i) => `${i + 1}. ${g}`).join('\n')
      await sock.sendMessage(from, {
        text: `🌿 ¿Con qué género te identificas?\n\n${lista}\n\n_Responde con el número._`
      }, { quoted: msg })
      return
    }

    // ─── Paso 4: Género ──────────────────────────────────────────────────────
    if (paso === 4) {
      const idx = parseInt(respuesta) - 1
      if (isNaN(idx) || idx < 0 || idx >= GENEROS.length) {
        await sock.sendMessage(from, {
          text: '🌸 Responde con el número de la opción.'
        }, { quoted: msg })
        return
      }
      sesion.genero = GENEROS[idx]
      sesion.paso   = 5
      const lista = PAISES.map((p, i) => `${i + 1}. ${p}`).join('\n')
      await sock.sendMessage(from, {
        text: `🌿 ¿De qué país eres?\n\n${lista}\n\n_Responde con el número._`
      }, { quoted: msg })
      return
    }

    // ─── Paso 5: País ────────────────────────────────────────────────────────
    if (paso === 5) {
      const idx = parseInt(respuesta) - 1
      if (isNaN(idx) || idx < 0 || idx >= PAISES.length) {
        await sock.sendMessage(from, {
          text: '🌸 Responde con el número del país.'
        }, { quoted: msg })
        return
      }
      sesion.pais = PAISES[idx]

      // Guardar en DB - usando registerUser
      registerUser(userNum, { 
        nombre: sesion.nombre, 
        apodo: sesion.apodo, 
        edad: sesion.edad, 
        genero: sesion.genero, 
        pais: sesion.pais 
      })
      sesiones.delete(userNum)

      const msgOk = global.messages?.registroOk || '✅ Registro completado, {nombre}'
      await sock.sendMessage(from, {
        text: msgOk.replace('{nombre}', sesion.nombre) +
          `\n\n🌸 Usa *.perfil* para ver tu perfil.`
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
        `Son 5 preguntas. Escribe *cancelar* para detener el proceso.\n\n` +
        `🌸 ¿Cuál es tu nombre?`
    }, { quoted: msg })
  }
}