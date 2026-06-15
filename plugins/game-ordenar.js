// plugins/ordena.js
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
  'Ordena la palabra escondida, tienes 3 intentos.',
  'Descifra la palabra oculta, tienes 3 intentos.',
  'Las letras están revueltas, tienes 3 intentos.',
  '¿Qué palabra se esconde aquí? Tienes 3 intentos.',
  'Midori te reta a ordenar esto, tienes 3 intentos.',
  'A ver si adivinas, tienes 3 intentos.',
]

const frasesVictoria = [
  '¡Eso es! Era {palabra}. Ganaste {kryons} y {xp} de exp.',
  '¡Impresionante! {palabra} era la respuesta. Te llevaste {kryons} y {xp} de exp.',
  '¡Correcto! {palabra} bien ordenada. {kryons} y {xp} de exp para vos.',
  '¡Lo lograste! {palabra} estaba enredada. Midori te da {kryons} y {xp} de exp.',
  '¡Mente brillante! {palabra} sin problema. {kryons} y {xp} de exp.',
  '¡Así se juega! {palabra} desenredada. Ganaste {kryons} y {xp} de exp.',
]

const frasesDerrota = [
  '¡Se acabaron los intentos! No lograste ordenar la palabra.',
  '¡Casi! Pero no pudiste descifrarla.',
  'Te quedaste sin intentos, otra vez será.',
  'Esta vez no fue, las letras te ganaron.',
  'No lo lograste esta vez. ¡Otra vez será!',
  'No te rindas, la próxima sale.',
]

function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function obtenerGanancia() {
  const premios = [200, 250, 300, 350, 400, 450, 500]
  return premios[Math.floor(Math.random() * premios.length)]
}

function desordenar(palabra) {
  return palabra.split('').sort(() => Math.random() - 0.5).join(' ')
}

export default {
  command: ['ordena', 'anagrama', 'wordgame'],
  tag: 'ordena',
  categoria: 'juego',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Ordena la palabra desordenada y gana premios',

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

    if (entrada === 'pista') {
      if (sesion.pistasCompradas >= 2) {
        await sock.sendMessage(from, { text: '> 🌸 Ya usaste tus 2 pistas.' }, { quoted: msg })
        return
      }

      sesion.pistasCompradas++
      const letra = sesion.palabraOriginal[sesion.pistasCompradas - 1]
      await sock.sendMessage(from, { text: `> 💡 Pista ${sesion.pistasCompradas}: empieza con *${letra.toUpperCase()}*` }, { quoted: msg })
      return
    }

    if (entrada.split(/\s+/).length > 1) {
      await sock.sendMessage(from, { text: '> 🌸 Solo la palabra exacta, sin espacios.' }, { quoted: msg })
      return
    }

    const respuestaLimpia = normalizarTexto(entrada)
    const originalLimpia = normalizarTexto(sesion.palabraOriginal)

    if (respuestaLimpia === originalLimpia) {
      const premioKryons = obtenerGanancia()
      const premioXp = Math.floor(premioKryons / 4)

      addKryons(userNum, premioKryons)
      addXp(userNum, premioXp)
      sesiones.delete(userNum)

      const msgV = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)]
        .replace('{palabra}', sesion.palabraOriginal)
        .replace('{kryons}', `${premioKryons.toLocaleString()} kryons`)
        .replace('{xp}', `${premioXp} de exp`)

      await sock.sendMessage(from, { react: { text: '🧩', key: msg.key } })
      await sock.sendMessage(from, { text: `> 🌸 ${msgV}` }, { quoted: msg })

    } else {
      sesion.intentos--
      if (sesion.intentos <= 0) {
        sesiones.delete(userNum)
        const msgD = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)]

        await sock.sendMessage(from, { react: { text: '💔', key: msg.key } })
        await sock.sendMessage(from, { text: `> 🌸 ${msgD}` }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          text: `> ✦ *${sesion.palabraDesordenada.toUpperCase()}*\n> 🌸 No es, te quedan *${sesion.intentos}* intentos.\n> ❤️ x${sesion.intentos}  │  *pista*`
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
      return sock.sendMessage(from, { text: '> 🌸 Ya tienes un juego activo. Termínalo o escribe *cancelar*.' }, { quoted: msg })
    }

    const palabraOriginal = palabras[Math.floor(Math.random() * palabras.length)]
    const palabraDesordenada = desordenar(palabraOriginal)

    sesiones.set(selfNum, {
      palabraOriginal,
      palabraDesordenada,
      intentos: 3,
      pistasCompradas: 0,
      ultimoMensaje: 0
    })

    const frase = frasesInicio[Math.floor(Math.random() * frasesInicio.length)]

    await sock.sendMessage(from, {
      text: `> ✦ *${palabraDesordenada.toUpperCase()}*\n> 🌸 ${frase}\n> ❤️ x3  │  *pista*  │  Escribe *cancelar* para salir.`
    }, { quoted: msg })
  }
}