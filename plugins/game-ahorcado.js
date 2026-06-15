// plugins/ahorcado.js
import { addKryons, addXp, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()
const palabras = [
  'programacion', 'tecnologia', 'ingenieria', 'honduras', 'robotica',
  'inteligencia', 'servidor', 'bot', 'javascript', 'algoritmo',
  'computadora', 'internet', 'software', 'hardware', 'aplicacion',
  'desarrollo', 'codigo', 'web', 'movil', 'escritorio',
  'red', 'base', 'datos', 'nube', 'seguridad',
  'firewall', 'virus', 'antivirus', 'hacker', 'usuario',
  'contraseña', 'correo', 'documento', 'archivo', 'carpeta',
  'sistema', 'operativo', 'windows', 'linux', 'mac',
  'android', 'iphone', 'tablet', 'pantalla', 'teclado',
  'mouse', 'impresora', 'escanner', 'camara', 'microfono',
  'altavoz', 'auricular', 'memoria', 'procesador', 'grafica',
  'disco', 'duro', 'ssd', 'ram', 'gigabyte',
  'megabyte', 'kilobyte', 'terabyte', 'hertz', 'velocidad',
  'rendimiento', 'optimizacion', 'compresion', 'encriptacion', 'autenticacion',
  'verificacion', 'validacion', 'error', 'depuracion', 'prueba',
  'produccion', 'lanzamiento', 'version', 'actualizacion', 'parche',
  'comando', 'terminal', 'consola', 'debug', 'compilar',
  'ejecutar', 'instalar', 'desinstalar', 'configurar', 'personalizar',
  'pantalla', 'inicio', 'cierre', 'reinicio', 'apagar',
  'encender', 'navegador', 'chrome', 'firefox', 'opera',
  'edge', 'safari', 'busqueda', 'explorador', 'sitio',
  'pagina', 'link', 'enlace', 'descargar', 'subir',
  'guardar', 'eliminar', 'editar', 'copiar', 'pegar',
  'cortar', 'renombrar', 'mover', 'organizar', 'buscar',
  'filtrar', 'ordenar', 'listar', 'mostrar', 'ocultar',
  'abrir', 'cerrar', 'minimizar', 'maximizar', 'restaurar',
  'ventana', 'pestaña', 'boton', 'menu', 'barra',
  'herramienta', 'opcion', 'ajuste', 'preferencia', 'idioma',
  'fecha', 'hora', 'zona', 'horaria', 'region',
  'pais', 'ciudad', 'direccion', 'calle', 'numero',
  'casa', 'edificio', 'piso', 'departamento', 'oficina',
  'escuela', 'universidad', 'colegio', 'instituto', 'academia',
  'curso', 'clase', 'leccion', 'tema', 'unidad',
  'estudio', 'aprendizaje', 'enseñanza', 'educacion', 'conocimiento',
  'saber', 'sabiduria', 'experiencia', 'habilidad', 'talento',
  'destreza', 'capacidad', 'competencia', 'dominio', 'maestria',
  'arte', 'ciencia', 'matematica', 'fisica', 'quimica',
  'biologia', 'historia', 'geografia', 'literatura', 'filosofia',
  'logica', 'razon', 'pensamiento', 'analisis', 'sintesis',
  'evaluacion', 'criterio', 'juicio', 'decision', 'eleccion',
  'opcion', 'alternativa', 'posibilidad', 'probabilidad', 'azar',
  'suerte', 'destino', 'futuro', 'pasado', 'presente',
  'tiempo', 'espacio', 'lugar', 'ubicacion', 'posicion',
  'orientacion', 'direccion', 'sentido', 'camino', 'ruta',
  'viaje', 'recorrido', 'distancia', 'velocidad', 'aceleracion',
  'movimiento', 'reposo', 'energia', 'fuerza', 'potencia',
  'trabajo', 'esfuerzo', 'dedicacion', 'disciplina', 'constancia',
  'paciencia', 'tolerancia', 'respeto', 'honestidad', 'lealtad',
  'amistad', 'amor', 'familia', 'padres', 'madre',
  'padre', 'hijo', 'hija', 'hermano', 'hermana',
  'abuelo', 'abuela', 'nieto', 'nieta', 'tio',
  'tia', 'primo', 'prima', 'sobrino', 'sobrina',
  'vecino', 'vecina', 'compañero', 'compañera', 'colega',
  'jefe', 'empleado', 'trabajador', 'obrero', 'profesional',
  'doctor', 'ingeniero', 'arquitecto', 'abogado', 'contador',
  'maestro', 'profesor', 'alumno', 'estudiante', 'aprendiz',
  'practicante', 'becario', 'pasante', 'ayudante', 'asistente',
  'secretario', 'recepcionista', 'cajero', 'vendedor', 'comprador',
  'cliente', 'proveedor', 'socio', 'inversionista', 'empresario',
  'emprendedor', 'innovador', 'creador', 'inventor', 'descubridor',
  'explorador', 'investigador', 'científico', 'tecnologo', 'especialista',
  'experto', 'novato', 'principiante', 'intermedio', 'avanzado',
  'basico', 'elemental', 'inicial', 'primario', 'secundario',
  'terciario', 'superior', 'posgrado', 'maestria', 'doctorado',
  'diploma', 'certificado', 'titulo', 'grado', 'nivel',
  'etapa', 'fase', 'proceso', 'procedimiento', 'metodo',
  'tecnica', 'estrategia', 'plan', 'proyecto', 'meta',
  'objetivo', 'fin', 'propósito', 'motivo', 'causa',
  'efecto', 'resultado', 'consecuencia', 'impacto', 'reaccion',
  'respuesta', 'solucion', 'alternativa', 'opcion', 'posibilidad',
  'evento', 'suceso', 'acontecimiento', 'caso', 'ejemplo',
  'modelo', 'patron', 'estructura', 'forma', 'tipo',
  'clase', 'categoria', 'grupo', 'conjunto', 'coleccion',
  'serie', 'secuencia', 'orden', 'secuencia', 'lista',
  'matriz', 'tabla', 'grafico', 'diagrama', 'esquema',
  'mapa', 'plano', 'diseno', 'boceto', 'borrador',
  'original', 'copia', 'duplicado', 'respaldo', 'seguro',
  'prevision', 'planeacion', 'organizacion', 'coordinacion', 'control',
  'supervision', 'monitoreo', 'seguimiento', 'evaluacion', 'medicion',
  'analisis', 'interpretacion', 'comprension', 'entendimiento', 'asimilacion',
  'retencion', 'memoria', 'recordar', 'olvidar', 'aprender',
  'enseñar', 'transmitir', 'compartir', 'colaborar', 'cooperar',
  'ayudar', 'apoyar', 'asistir', 'guiar', 'orientar',
  'dirigir', 'liderar', 'mandar', 'obedecer', 'cumplir',
  'respetar', 'valorar', 'apreciar', 'estimar', 'querer',
  'desear', 'necesitar', 'requerir', 'solicitar', 'pedir',
  'preguntar', 'responder', 'contestar', 'comunicar', 'dialogar',
  'conversar', 'discutir', 'debatir', 'argumentar', 'explicar',
  'describir', 'detallar', 'especificar', 'definir', 'limitar',
  'restringir', 'permitir', 'autorizar', 'aprobar', 'aceptar',
  'rechazar', 'negar', 'dudar', 'cuestionar', 'investigar',
  'indagar', 'explorar', 'descubrir', 'encontrar', 'hallar',
  'buscar', 'rastrear', 'seguir', 'perseguir', 'alcanzar',
  'lograr', 'conseguir', 'obtener', 'adquirir', 'recibir',
  'tomar', 'agarrar', 'sostener', 'sujetar', 'sostener',
  'levantar', 'bajar', 'subir', 'descender', 'avanzar',
  'retroceder', 'girar', 'doblar', 'torcer', 'enderezar',
  'alinear', 'centrar', 'equilibrar', 'balancear', 'ajustar'
]
const frasesInicio = [
  'Adivina la palabra letra por letra, tienes 5 vidas.',
  '¿Podrás descubrir la palabra oculta? Tienes 5 intentos.',
  'Demuestra tu vocabulario, 5 vidas para acertar.',
]

const frasesVictoria = [
  '¡Increíble! Descubriste *{palabra}*. Ganaste {kryons} y {xp} de exp.',
  '¡Completamente correcto! Era *{palabra}*. Te llevaste {kryons} y {xp} de exp.',
  '¡Lo lograste! *{palabra}* era la palabra. Midori te da {kryons} y {xp} de exp.',
]

const frasesDerrota = [
  'Te quedaste sin vidas, la palabra era *{palabra}*.',
  'Fin del juego, no lograste adivinar. Era *{palabra}*.',
  'El ahorcado te ganó, la palabra correcta era *{palabra}*.',
]

function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export default {
  command: ['ahorcado', 'hang', 'hangman'],
  tag: 'ahorcado',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Adivina la palabra oculta antes de quedarte sin vidas',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const ahora = Date.now()
    if (sesion.ultimoMensaje && (ahora - sesion.ultimoMensaje < 1200)) return
    sesion.ultimoMensaje = ahora

    const entrada = text?.trim().toLowerCase()
    if (!entrada) return

    if (entrada === 'cancelar') {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '> 🌸 Juego cancelado.' }, { quoted: msg })
      return
    }

    if (entrada.length !== 1 || !/[a-zñ]/.test(entrada)) return

    const letraLimpia = normalizarTexto(entrada)

    if (sesion.letrasUsadas.includes(letraLimpia)) {
      return sock.sendMessage(from, { text: `> 🌸 Ya usaste la *${entrada.toUpperCase()}*. Prueba otra.` }, { quoted: msg })
    }

    sesion.letrasUsadas.push(letraLimpia)

    const palabraLimpia = normalizarTexto(sesion.palabraOriginal)
    let acierto = false

    for (let i = 0; i < palabraLimpia.length; i++) {
      if (palabraLimpia[i] === letraLimpia) {
        sesion.progreso[i] = sesion.palabraOriginal[i]
        acierto = true
      }
    }

    if (acierto) {
      if (!sesion.progreso.includes('_')) {
        const premioKryons = Math.floor(Math.random() * 400) + 300
        const premioXp = Math.floor(premioKryons / 4)

        addKryons(userNum, premioKryons)
        addXp(userNum, premioXp)
        sesiones.delete(userNum)

        const frase = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)]
          .replace('{palabra}', sesion.palabraOriginal)
          .replace('{kryons}', `*${premioKryons.toLocaleString()} kryons*`)
          .replace('{xp}', `*${premioXp}*`)

        await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
        await sock.sendMessage(from, {
          text: `> 🌸 ${frase}`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          text: `> ✦ ${sesion.progreso.join(' ').toUpperCase()}\n> 🌸 ¡ *${entrada.toUpperCase()}* acertada!  │  ❤️ x${sesion.intentos}`
        }, { quoted: msg })
      }
    } else {
      sesion.intentos--
      if (sesion.intentos <= 0) {
        sesiones.delete(userNum)
        const frase = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)]
          .replace('{palabra}', sesion.palabraOriginal)

        await sock.sendMessage(from, { react: { text: '💀', key: msg.key } })
        await sock.sendMessage(from, { text: `> 🌸 ${frase}` }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          text: `> ✦ ${sesion.progreso.join(' ').toUpperCase()}\n> 🌸 *${entrada.toUpperCase()}* no está  │  ❤️ x${sesion.intentos}`
        }, { quoted: msg })
      }
    }
  },

  async execute(sock, msg, { from, userNum, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (sesiones.has(selfNum)) {
      return sock.sendMessage(from, { text: '> 🌸 Ya tienes una partida activa. Termínala o escribe *cancelar*.' }, { quoted: msg })
    }

    const palabraOriginal = palabras[Math.floor(Math.random() * palabras.length)]
    const progreso = Array(palabraOriginal.length).fill('_')

    sesiones.set(selfNum, {
      palabraOriginal,
      progreso,
      intentos: 5,
      letrasUsadas: [],
      ultimoMensaje: 0
    })

    const frase = frasesInicio[Math.floor(Math.random() * frasesInicio.length)]

    await sock.sendMessage(from, {
      text: `> ✦ ${progreso.join(' ')}\n> 🌸 ${frase}  │  ❤️ x5  │  Escribe *cancelar* para salir.`
    }, { quoted: msg })
  }
}