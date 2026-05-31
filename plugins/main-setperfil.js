import { getUser, setUserField, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

// Pasos que esperan solo un número (ignoran texto libre silenciosamente)
const PASOS_NUMERICOS = new Set([0, 5, 6])

const GENEROS = ['hombre', 'mujer', 'prefiero no decir']

const PAISES = [
  'Belice', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras',
  'Nicaragua', 'Panamá', 'México', 'Estados Unidos', 'Canadá',
  'Cuba', 'Haití', 'República Dominicana', 'Jamaica', 'Puerto Rico',
  'Trinidad y Tobago', 'Bahamas', 'Barbados', 'Granada',
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Ecuador', 'Guyana', 'Paraguay', 'Perú', 'Surinam',
  'Uruguay', 'Venezuela',
  'España', 'Portugal', 'Francia', 'Italia', 'Alemania',
  'Reino Unido', 'Países Bajos', 'Suiza', 'Suecia', 'Noruega',
  'Otro'
]

export default {
  command:     'setperfil',
  tag:         'setperfil',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Edita los campos de tu perfil',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    const { paso } = sesion
    const esNumerico = /^\d+$/.test(respuesta)

    // Cancelar siempre funciona
    if (respuesta.toLowerCase() === 'cancelar') {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌸 Edición cancelada.' }, { quoted: msg })
      return
    }

    // Pasos numéricos: ignorar silenciosamente si mandan texto
    if (PASOS_NUMERICOS.has(paso) && !esNumerico) return

    // ── Paso 0: menú principal ──────────────────────────────────────
    if (paso === 0) {
      switch (parseInt(respuesta)) {
        case 1:
          sesion.paso = 1
          await sock.sendMessage(from, {
            text: `✏️ ¿Cuál será tu nuevo nombre?\n\n_Escribe *cancelar* para salir._`
          }, { quoted: msg })
          break
        case 2:
          sesion.paso = 2
          await sock.sendMessage(from, {
            text: `🎂 ¿Cuántos años tienes? (10-60)\n\n_Escribe *cancelar* para salir._`
          }, { quoted: msg })
          break
        case 3:
          sesion.paso = 3
          await sock.sendMessage(from, {
            text: `💬 ¿Qué frase quieres poner?\n\n_Escribe *cancelar* para salir._`
          }, { quoted: msg })
          break
        case 4:
          sesion.paso = 4
          await sock.sendMessage(from, {
            text: `🎨 ¿Cuál es tu color favorito?\n\n_Escribe *cancelar* para salir._`
          }, { quoted: msg })
          break
        case 5:
          sesion.paso = 5
          await sock.sendMessage(from, {
            text: `🐾 ¿Cuál es tu animal favorito?\n\n_Escribe *cancelar* para salir._`
          }, { quoted: msg })
          break
        case 6:
          sesion.paso = 6
          await sock.sendMessage(from, {
            text: `👤 ¿Con qué género te identificas?\n\n${GENEROS.map((g, i) => `${i + 1}. ${g}`).join('\n')}\n\n_Responde con el número._`
          }, { quoted: msg })
          break
        case 7:
          sesion.paso = 7
          await sock.sendMessage(from, {
            text: `🌍 ¿De qué país eres?\n\n${PAISES.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n_Responde con el número._`
          }, { quoted: msg })
          break
        case 8:
          sesion.paso = 8
          await sock.sendMessage(from, {
            text: `🌸 ¿Qué apodo quieres tener?\n\n_Escribe *cancelar* para salir._`
          }, { quoted: msg })
          break
        case 9:
          sesiones.delete(userNum)
          await sock.sendMessage(from, { text: '🌸 Edición cancelada.' }, { quoted: msg })
          break
        default:
          break
      }
      return
    }

    // ── Paso 1: nombre (texto libre) ────────────────────────────────
    if (paso === 1) {
      if (respuesta.length < 2 || respuesta.length > 30) {
        await sock.sendMessage(from, {
          text: '🌸 El nombre debe tener entre 2 y 30 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'nombre', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `✏️ Nombre actualizado: *${respuesta}*\n\n🌸 ¡Así te conocerán ahora!`
      }, { quoted: msg })
      return
    }

    // ── Paso 2: edad (numérico pero validado aquí, no en el Set) ────
    if (paso === 2) {
      const edad = parseInt(respuesta)
      if (!esNumerico || isNaN(edad) || edad < 10 || edad > 60) {
        await sock.sendMessage(from, {
          text: '🌸 Edad inválida. Debe ser un número entre 10 y 60.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'edad', edad)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🎂 Edad actualizada: *${edad} años*`
      }, { quoted: msg })
      return
    }

    // ── Paso 3: frase (texto libre) ─────────────────────────────────
    if (paso === 3) {
      if (respuesta.length > 100) {
        await sock.sendMessage(from, {
          text: '🌸 La frase es muy larga, máximo 100 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'frase', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `💬 Frase actualizada:\n\n_"${respuesta}"_\n\n🌸 Tu perfil se ve más bonito ahora.`
      }, { quoted: msg })
      return
    }

    // ── Paso 4: color (texto libre) ─────────────────────────────────
    if (paso === 4) {
      if (respuesta.length > 30) {
        await sock.sendMessage(from, {
          text: '🌸 Ese color es muy largo, máximo 30 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'color', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🎨 Color favorito actualizado: *${respuesta}*`
      }, { quoted: msg })
      return
    }

    // ── Paso 5: animal (texto libre) ────────────────────────────────
    if (paso === 5) {
      if (respuesta.length > 30) {
        await sock.sendMessage(from, {
          text: '🌸 Ese nombre es muy largo, máximo 30 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'animal', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🐾 Animal favorito actualizado: *${respuesta}*`
      }, { quoted: msg })
      return
    }

    // ── Paso 6: género (numérico) ───────────────────────────────────
    if (paso === 6) {
      const idx = parseInt(respuesta) - 1
      if (idx < 0 || idx >= GENEROS.length) {
        await sock.sendMessage(from, {
          text: '🌸 Responde con el número de la opción.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'genero', GENEROS[idx])
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `✅ Género actualizado: *${GENEROS[idx]}*`
      }, { quoted: msg })
      return
    }

    // ── Paso 7: país (numérico) ─────────────────────────────────────
    if (paso === 7) {
      const idx = parseInt(respuesta) - 1
      if (idx < 0 || idx >= PAISES.length) {
        await sock.sendMessage(from, {
          text: '🌸 Responde con el número del país.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'pais', PAISES[idx])
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🌍 País actualizado: *${PAISES[idx]}*`
      }, { quoted: msg })
      return
    }

    // ── Paso 8: apodo (texto libre) ─────────────────────────────────
    if (paso === 8) {
      if (respuesta.length > 25) {
        await sock.sendMessage(from, {
          text: '🌸 El apodo es muy largo, máximo 25 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'apodo', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🌸 Apodo actualizado: *${respuesta}*`
      }, { quoted: msg })
      return
    }
  },

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (sesiones.has(selfNum)) {
      await sock.sendMessage(from, {
        text: '🌸 Ya tienes una edición en proceso. Responde o escribe *cancelar*.'
      }, { quoted: msg })
      return
    }

    const perfil = getUser(selfNum)
    sesiones.set(selfNum, { paso: 0 })

    let txt = `🌸 *¿Qué quieres editar?*\n\n`
    txt += `*1.* ✏️ Nombre _(${perfil.nombre})_\n`
    txt += `*2.* 🎂 Edad _(${perfil.edad} años)_\n`
    txt += `*3.* 💬 Frase ${perfil.frase         ? `_(${perfil.frase.slice(0, 25)}...)_`  : ''}\n`
    txt += `*4.* 🎨 Color favorito ${perfil.color ? `_(${perfil.color})_`                 : ''}\n`
    txt += `*5.* 🐾 Animal favorito ${perfil.animal ? `_(${perfil.animal})_`              : ''}\n`
    txt += `*6.* 👤 Género ${perfil.genero        ? `_(${perfil.genero})_`                : ''}\n`
    txt += `*7.* 🌍 País ${perfil.pais             ? `_(${perfil.pais})_`                 : ''}\n`
    txt += `*8.* 🌸 Apodo ${perfil.apodo           ? `_(${perfil.apodo})_`                : ''}\n`
    txt += `*9.* ❌ Cancelar\n\n`
    txt += `_Responde con el número._`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}