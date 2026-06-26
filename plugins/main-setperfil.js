// plugins/setperfil.js
import { getUser, setUserField } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones  = new Map()
const procesados = new Set() // IDs de mensajes ya manejados por setperfil

const GENEROS = ['Hombre', 'Mujer', 'Prefiero no decir']

const PAISES = [
  'Belice', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras',
  'Nicaragua', 'Panamá', 'México', 'Estados Unidos', 'Canadá',
  'Cuba', 'Haití', 'República Dominicana', 'Jamaica', 'Puerto Rico',
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Ecuador', 'Paraguay', 'Perú', 'Uruguay', 'Venezuela',
  'España', 'Portugal', 'Francia', 'Italia', 'Alemania',
  'Reino Unido', 'Suiza', 'Suecia', 'Noruega', 'Otro'
]

const CAMPOS = ['nombre', 'apodo', 'edad', 'frase', 'color', 'animal', 'genero', 'pais']

const ETIQUETAS = {
  nombre: 'Nombre',
  apodo:  'Apodo',
  edad:   'Edad',
  frase:  'Frase',
  color:  'Color favorito',
  animal: 'Animal favorito',
  genero: 'Género',
  pais:   'País',
}

const PREGUNTAS = {
  nombre: '¿Cuál será tu nuevo nombre?',
  apodo:  '¿Qué apodo quieres tener?',
  edad:   '¿Cuántos años tienes? Debe ser entre 13 y 60.',
  frase:  '¿Qué frase quieres poner en tu perfil?',
  color:  '¿Cuál es tu color favorito?',
  animal: '¿Cuál es tu animal favorito?',
  genero: `¿Con qué género te identificas?\n\n${GENEROS.map((g, i) => `  ${i + 1}. ${g}`).join('\n')}`,
  pais:   `¿De qué país eres?\n\n${PAISES.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}`,
}

function mostrarValor(perfil, campo) {
  const val = perfil?.[campo]
  if (!val || val === '' || val === 0) return '_aún no has puesto nada_'
  if (campo === 'edad') return `_${val} años_`
  return `_${val}_`
}

function construirMenu(perfil) {
  let txt = `⚙️ *Editar perfil*\n\n`
  CAMPOS.forEach((campo, i) => {
    txt += `  ${i + 1}. *${ETIQUETAS[campo]}*\n`
    txt += `  > ↳ ${mostrarValor(perfil, campo)}\n\n`
  })
  txt += `Escribe el número del campo que quieres editar o *cancelar* para salir.`
  return txt
}

export default {
  command:     ['setperfil', 'editarperfil'],
  tag:         'setperfil',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Personaliza tu perfil',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return
    if (from.endsWith('@g.us')) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const msgId = msg.key?.id
    const respuestaOriginal = text?.trim()
    const respuesta         = respuestaOriginal?.toLowerCase()
    if (!respuesta) return

    // Ignorar el mensaje que ya fue procesado para elegir campo
    if (sesion.msgIdIgnorar && sesion.msgIdIgnorar === msgId) return

    // Cancelar en cualquier momento
    if (respuesta === 'cancelar') {
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: 'Cuando quieras volver a editar tu perfil, aquí estaré.'
      }, { quoted: msg })
      return
    }

    // ── Esperando número de campo ─────────────────────────────────────────────
    if (sesion.paso === 'menu') {
      const idx = parseInt(respuesta) - 1
      if (isNaN(idx) || idx < 0 || idx >= CAMPOS.length) return

      sesion.campo        = CAMPOS[idx]
      sesion.paso         = 'editar'
      sesion.msgIdIgnorar = msgId  // ← ignorar este mensaje cuando vuelva al menú

      await sock.sendMessage(from, { text: PREGUNTAS[sesion.campo] }, { quoted: msg })
      return
    }

    // ── Editando campo ────────────────────────────────────────────────────────
    if (sesion.paso === 'editar') {
      const campo = sesion.campo
      let valor   = campo === 'nombre' || campo === 'apodo' ? respuestaOriginal : respuesta

      if (campo === 'edad') {
        const edad = parseInt(respuesta)
        if (isNaN(edad) || edad < 13 || edad > 60) return
        valor = edad
      }

      if (campo === 'nombre') {
        if (respuestaOriginal.length < 2 || respuestaOriginal.length > 30) {
          await sock.sendMessage(from, {
            text: 'El nombre debe tener entre 2 y 30 caracteres, ni tan corto ni tan largo.'
          }, { quoted: msg })
          return
        }
      }

      if (campo === 'apodo') {
        if (respuestaOriginal.length > 25) {
          await sock.sendMessage(from, {
            text: 'El apodo es muy largo, máximo 25 caracteres.'
          }, { quoted: msg })
          return
        }
      }

      if (campo === 'genero') {
        const idx = parseInt(respuesta) - 1
        if (isNaN(idx) || idx < 0 || idx >= GENEROS.length) return
        valor = GENEROS[idx]
      }

      if (campo === 'pais') {
        const idx = parseInt(respuesta) - 1
        if (isNaN(idx) || idx < 0 || idx >= PAISES.length) return
        valor = PAISES[idx]
      }

      setUserField(userNum, campo, valor)
      sesion.msgIdIgnorar = null

      const confirmaciones = {
        nombre: `Listo, ahora te llamas *${valor}*.`,
        apodo:  `Apodo actualizado: *${valor}*.`,
        edad:   `Edad guardada: *${valor} años*.`,
        frase:  `Tu frase quedó así: _${valor}_`,
        color:  `Color favorito: *${valor}*.`,
        animal: `Animal favorito: *${valor}*.`,
        genero: `Género: *${valor}*.`,
        pais:   `País: *${valor}*.`,
      }

      await sock.sendMessage(from, { text: confirmaciones[campo] }, { quoted: msg })

      sesion.paso  = 'menu'
      sesion.campo = null

      const perfil = getUser(userNum)
      await sock.sendMessage(from, { text: construirMenu(perfil) }, { quoted: msg })
      return
    }
  },

  async execute(sock, msg, { from, sender, isGroup }) {
    if (isGroup) {
      await sock.sendMessage(from, {
        text: 'Eso mejor lo hacemos en privado, no todo el grupo necesita saber tu información. Escríbeme por aquí y lo resolvemos.'
      }, { quoted: msg })
      return
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (sesiones.has(selfNum)) {
      const perfil = getUser(selfNum)
      await sock.sendMessage(from, {
        text: `Ya tienes una edición en marcha. Aquí va el menú por si lo perdiste.\n\n${construirMenu(perfil)}`
      }, { quoted: msg })
      return
    }

    const perfil = getUser(selfNum)
    sesiones.set(selfNum, { paso: 'menu', campo: null, msgIdIgnorar: null })

    await sock.sendMessage(from, { text: construirMenu(perfil) }, { quoted: msg })
  }
}