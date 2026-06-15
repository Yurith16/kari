// plugins/setperfil.js
import { getUser, setUserField, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const GENEROS = ['hombre', 'mujer', 'prefiero no decir']

const PAISES = [
  'Belice', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras',
  'Nicaragua', 'Panamá', 'México', 'Estados Unidos', 'Canadá',
  'Cuba', 'Haití', 'República Dominicana', 'Jamaica', 'Puerto Rico',
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Ecuador', 'Paraguay', 'Perú', 'Uruguay', 'Venezuela',
  'España', 'Portugal', 'Francia', 'Italia', 'Alemania',
  'Reino Unido', 'Suiza', 'Suecia', 'Noruega', 'Otro'
]

const orden = ['nombre', 'apodo', 'edad', 'frase', 'color', 'animal', 'genero', 'pais']

export default {
  command: 'setperfil',
  tag: 'setperfil',
  categoria: 'main',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Embellece tu perfil paso a paso',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return
    if (from.endsWith('@g.us')) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    // No convertir a minúsculas, mantener original para nombre y apodo
    const respuestaOriginal = text?.trim()
    const respuesta = respuestaOriginal?.toLowerCase()
    if (!respuesta) return

    if (respuesta === 'cancelar') {
      sesiones.delete(userNum)
      return sock.sendMessage(from, { text: '🌸 Bueno, tu perfil se queda como está. Cuando quieras volvemos a intentarlo.' }, { quoted: msg })
    }

    if (sesion.paso === 'confirmar') {
      if (respuesta === 'si' || respuesta === 'sí') {
        sesion.paso = 0
        sesion.indice = 0
        return preguntarCampo(sock, from, msg, userNum)
      }
      if (respuesta === 'no') {
        sesiones.delete(userNum)
        return sock.sendMessage(from, { text: '🌸 Está bien, tu perfil sigue intacto. Hablamos luego.' }, { quoted: msg })
      }
      return
    }

    if (sesion.paso === 'preguntar') {
      if (respuesta !== 'si' && respuesta !== 'sí' && respuesta !== 'no') return

      if (respuesta === 'si' || respuesta === 'sí') {
        sesion.paso = 'editar'
        const campo = orden[sesion.indice]
        const mensajes = {
          nombre: '✏️ ¿Cuál será tu nuevo nombre?',
          apodo: '🌸 ¿Qué apodo quieres tener?',
          edad: '🎂 ¿Cuántos años tienes?',
          frase: '💬 ¿Qué frase quieres poner en tu perfil?',
          color: '🎨 ¿Cuál es tu color favorito?',
          animal: '🐾 ¿Cuál es tu animal favorito?',
          genero: `👤 ¿Con qué género te identificas?\n\n${GENEROS.map((g, i) => `✦ ${i + 1}. ${g}`).join('\n')}`,
          pais: `🌍 ¿De qué país eres?\n\n${PAISES.map((p, i) => `✦ ${i + 1}. ${p}`).join('\n')}`,
        }
        return sock.sendMessage(from, { text: mensajes[campo] }, { quoted: msg })
      }

      if (respuesta === 'no') {
        sesion.indice++
        if (sesion.indice >= orden.length) {
          sesiones.delete(userNum)
          return sock.sendMessage(from, { text: '🌸 ¡Listo! Tu perfil quedó hermoso, así como está.' }, { quoted: msg })
        }
        return preguntarCampo(sock, from, msg, userNum)
      }
      return
    }

    if (sesion.paso === 'editar') {
      const campo = orden[sesion.indice]
      let valor = (campo === 'nombre' || campo === 'apodo') ? respuestaOriginal : respuesta
      let ok = true

      if (campo === 'edad') {
        const edad = parseInt(respuesta)
        if (isNaN(edad) || edad < 10 || edad > 60) {
          ok = false
          return sock.sendMessage(from, { text: '🌸 Esa edad no me cuadra, debe ser entre 10 y 60 años. Intenta de nuevo.' }, { quoted: msg })
        }
        valor = edad
      }

      if (campo === 'nombre' && (respuestaOriginal.length < 2 || respuestaOriginal.length > 30)) {
        ok = false
        return sock.sendMessage(from, { text: '🌸 El nombre debe tener entre 2 y 30 caracteres, ni tan corto ni tan largo.' }, { quoted: msg })
      }

      if (campo === 'apodo' && (respuestaOriginal.length > 25)) {
        ok = false
        return sock.sendMessage(from, { text: '🌸 El apodo es muy largo, máximo 25 caracteres.' }, { quoted: msg })
      }

      if (campo === 'genero') {
        const idx = parseInt(respuesta) - 1
        if (idx < 0 || idx >= GENEROS.length) {
          ok = false
          return sock.sendMessage(from, { text: '🌸 Responde con el número de la opción que más te represente.' }, { quoted: msg })
        }
        valor = GENEROS[idx]
      }

      if (campo === 'pais') {
        const idx = parseInt(respuesta) - 1
        if (idx < 0 || idx >= PAISES.length) {
          ok = false
          return sock.sendMessage(from, { text: '🌸 Responde con el número del país donde naciste.' }, { quoted: msg })
        }
        valor = PAISES[idx]
      }

      if (ok) {
        setUserField(userNum, campo, valor)
        sesion.indice++

        const confirmaciones = {
          nombre: `✏️ Listo, ahora te llamas *${valor}*. ¡Bonito nombre!`,
          apodo: `🌸 Apodo: *${valor}*. Así te llamarán ahora.`,
          edad: `🎂 Edad guardada: *${valor} años*.`,
          frase: `💬 Tu frase: _${valor}_. Le da personalidad a tu jardín.`,
          color: `🎨 Color favorito: *${valor}*.`,
          animal: `🐾 Animal favorito: *${valor}*.`,
          genero: `👤 Género: *${valor}*.`,
          pais: `🌍 País: *${valor}*.`,
        }

        await sock.sendMessage(from, { text: confirmaciones[campo] }, { quoted: msg })

        if (sesion.indice >= orden.length) {
          sesiones.delete(userNum)
          return sock.sendMessage(from, { text: '🌸 ¡Tu perfil quedó precioso! Midori está orgullosa de tu jardín.' }, { quoted: msg })
        }

        return preguntarCampo(sock, from, msg, userNum)
      }
    }
  },

  async execute(sock, msg, { from, sender, isGroup }) {
    if (isGroup) {
      return sock.sendMessage(from, {
        text: '🌸 Para evitar el spam, mejor ven a mi privado a embellecer tu perfil. Te espero.'
      }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (sesiones.has(selfNum)) {
      return sock.sendMessage(from, { text: '🌸 Ya tienes una edición en marcha. Responde o escribe *cancelar* para salir.' }, { quoted: msg })
    }

    sesiones.set(selfNum, { paso: 'confirmar' })

    await sock.sendMessage(from, {
      text: '🌸 Te iré preguntando paso a paso para dejar tu perfil bonito. ¿Empezamos?\n\nResponde *si* o *no*.'
    }, { quoted: msg })
  }
}

function preguntarCampo(sock, from, msg, userNum) {
  const sesion = sesiones.get(userNum)
  if (!sesion) return

  sesion.paso = 'preguntar'
  const perfil = getUser(userNum)
  const campo = orden[sesion.indice]

  const etiquetas = {
    nombre: 'tu nombre',
    apodo: 'tu apodo',
    edad: 'tu edad',
    frase: 'tu frase',
    color: 'tu color favorito',
    animal: 'tu animal favorito',
    genero: 'tu género',
    pais: 'tu país',
  }

  const valorActual = perfil[campo] || 'sin definir'

  return sock.sendMessage(from, {
    text: `🌸 ¿Quieres cambiar *${etiquetas[campo]}*? Ahora es: _${valorActual}_\n\nResponde *si* para editar o *no* para continuar.`
  }, { quoted: msg })
}