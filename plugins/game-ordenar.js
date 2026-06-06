// plugins/ordena.js
import { addKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
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
// Frases para darle personalidad
const frasesInicio = [
    "A ver qué tal andas de agilidad mental...",
    "¡Te reto! Ordena esto antes de que pierdas las vidas.",
    "Me he desordenado esta palabra, ¿me ayudas a ponerla en su lugar?",
    "A que no adivinas qué palabra secreta es esta."
]

const frasesVictoria = [
    "¡Eso es! Tenías razón, la palabra era {palabra}. ¡Te lo has ganado!",
    "¡Impresionante! Lo descifraste muy rápido. Toma tu gran recompensa.",
    "¡Correcto! Eres todo un maestro de los anagramas. ¡Qué nivel!",
    "¡Lo lograste! Se nota que tienes una mente brillante para las letras."
]

const frasesDerrota = [
    "¡Ay no! Se te acabaron los intentos. La palabra que buscábamos era *{palabra}*.",
    "¡Casi lo tenías! Pero la palabra correcta era *{palabra}*. ¡Para la próxima será!",
    "¡Oops! Te quedaste sin vidas. Era *{palabra}*, inténtalo de nuevo luego.",
    "¡Rayos! Me quedo con tus kryons esta vez. La palabra era *{palabra}*."
]

// Función para remover acentos y tildes fácilmente
function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// Función para obtener una ganancia más considerable y aleatoria
function obtenerGananciaGrande() {
    const premios = [250, 300, 350, 400, 450, 500]
    return premios[Math.floor(Math.random() * premios.length)]
}

// Añadimos espacios para que sea legible
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
    descripcion: '🌸 Ordena la palabra desordenada y gana premios',

    async onMessage(sock, msg, { from, text, userNum }) {
        const sesion = sesiones.get(userNum)
        if (!sesion) return

        // --- FILTRO ANTISPAM / COOLDOWN ---
        const ahora = Date.now()
        if (sesion.ultimoMensaje && (ahora - sesion.ultimoMensaje < 1200)) {
            return
        }
        sesion.ultimoMensaje = ahora

        const palabrasUsuario = text?.trim().toLowerCase().split(/\s+/)
        const respuesta = palabrasUsuario[0]
        if (!respuesta) return

        if (respuesta === 'cancelar') {
            sesiones.delete(userNum)
            await sock.sendMessage(from, { text: '🌿 Juego cancelado. ¡Nos vemos luego!' }, { quoted: msg })
            return
        }

        if (respuesta === 'pista') {
            const eco = getEconomy(userNum)
            if ((eco.kryons || 0) < 35) {
                await sock.sendMessage(from, { text: '🌸 Las pistas ahora son premium. No tienes suficientes kryons (Costo: 35).' }, { quoted: msg })
                return
            }
            if (sesion.pistasCompradas >= 2) {
                await sock.sendMessage(from, { text: '🌸 Ya usaste tus 2 pistas. ¡Ahora te toca a ti solita!' }, { quoted: msg })
                return
            }

            sesion.pistasCompradas++
            addKryons(userNum, -35)
            const letra = sesion.palabraOriginal[sesion.pistasCompradas - 1]
            await sock.sendMessage(from, { text: `> 💡 *Pista #${sesion.pistasCompradas}:* La letra es *${letra.toUpperCase()}*. ¡Sigue intentando!` }, { quoted: msg })
            return
        }

        // Si el usuario escribe una frase (más de una palabra), ignoramos el intento para proteger sus vidas
        if (palabrasUsuario.length > 1) {
            await sock.sendMessage(from, { text: '🌸 Por favor, responde solo con la palabra exacta para no perder tus vidas.' }, { quoted: msg })
            return
        }

        // Comparamos las versiones normalizadas (sin acentos) para evitar errores ortográficos
        const respuestaLimpia = normalizarTexto(respuesta)
        const originalLimpia = normalizarTexto(sesion.palabraOriginal)

        if (respuestaLimpia === originalLimpia) {
            const premioKryons = obtenerGananciaGrande()
            const premioXp = Math.floor(premioKryons / 5)

            addKryons(userNum, premioKryons)
            addXp(userNum, premioXp)
            sesiones.delete(userNum)

            const msgV = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)].replace('{palabra}', sesion.palabraOriginal)
            await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
            await sock.sendMessage(from, { text: `> 🌸 ${msgV}\n> ✦ Ganaste *${premioKryons} kryons* + *${premioXp} XP* ✨` }, { quoted: msg })
        } else {
            sesion.intentos--
            if (sesion.intentos <= 0) {
                sesiones.delete(userNum)
                const msgD = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)].replace('{palabra}', sesion.palabraOriginal)
                await sock.sendMessage(from, { react: { text: '💔', key: msg.key } })
                await sock.sendMessage(from, { text: `> 🌸 ${msgD}` }, { quoted: msg })
            } else {
                await sock.sendMessage(from, { text: `> 🌸 ¡Esa no es! Te quedan *${sesion.intentos}* vidas. Usa *pista* si necesitas ayuda.` }, { quoted: msg })
            }
        }
    },

    async execute(sock, msg, { from, userNum, sender }) {
        const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
        const selfNum = cleanNumber(selfJid)

        if (!isRegistered(selfNum)) return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })

        if (sesiones.has(selfNum)) return sock.sendMessage(from, { text: '🌸 Ya tienes un juego activo. Termínalo o escribe *cancelar*.' }, { quoted: msg })

        const palabraOriginal = palabras[Math.floor(Math.random() * palabras.length)]
        const palabraDesordenada = desordenar(palabraOriginal)

        sesiones.set(selfNum, { 
            palabraOriginal, 
            intentos: 3, 
            pistasCompradas: 0,
            ultimoMensaje: 0 
        })

        const frase = frasesInicio[Math.floor(Math.random() * frasesInicio.length)]
        
        await sock.sendMessage(from, { 
            text: `> 🌸 ${frase}\n\n> 🧩 *Palabra:* ${palabraDesordenada.toUpperCase()}\n> 💖 *Vidas:* 3  │  💰 *Pista:* 35 kryons\n\n> 🌿 Responde con la palabra, *pista* o *cancelar*.` 
        }, { quoted: msg })
    }
}