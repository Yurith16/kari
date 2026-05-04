// set-descripciones.js
// Uso: node set-descripciones.js ./plugins
// Rellena descripcion: '' con una descripción basada en el nombre del archivo.
// Solo toca archivos que tengan  descripcion: '',  (vacía).

import fs   from 'fs'
import path from 'path'

// ── Diccionario por nombre de plugin (sin extensión) ─────────────────────────
const MAPA = {
  // ADMIN
  'admin-abrir':        'Abre el grupo para que cualquiera pueda entrar',
  'admin-activos':      'Muestra los miembros más activos del grupo',
  'admin-adminmode':    'Activa el modo solo admins en el grupo',
  'admin-antilink':     'Activa o desactiva el antilink en el grupo',
  'admin-ban':          'Expulsa a un usuario del grupo',
  'admin-cerrar':       'Cierra el grupo para que solo admins puedan escribir',
  'admin-delete':       'Elimina un mensaje del grupo',
  'admin-demote':       'Quita el rango de admin a un miembro',
  'admin-descripcion':  'Cambia la descripción del grupo',
  'admin-enlace':       'Muestra el enlace de invitación del grupo',
  'admin-fantasmas':    'Detecta y lista los miembros inactivos del grupo',
  'admin-fotogrupo':    'Cambia la foto del grupo',
  'admin-goodbye':      'Configura el mensaje de despedida del grupo',
  'admin-hidetag':      'Menciona a todos sin mostrar las etiquetas',
  'admin-mute':         'Silencia a un usuario del grupo',
  'admin-mutelist':     'Muestra la lista de usuarios silenciados',
  'admin-nombregrupo':  'Cambia el nombre del grupo',
  'admin-nsfw':         'Activa o desactiva el contenido +18 en el grupo',
  'admin-promote':      'Asciende a un miembro a administrador',
  'admin-resetwarn':    'Resetea las advertencias de un usuario',
  'admin-revoke':       'Revoca y regenera el enlace de invitación',
  'admin-staff':        'Muestra la lista de administradores del grupo',
  'admin-tagall':       'Menciona a todos los miembros del grupo',
  'admin-unmute':       'Quita el silencio a un usuario del grupo',
  'admin-warn':         'Advierte a un usuario del grupo',
  'admin-warnlist':     'Muestra la lista de advertencias del grupo',
  'admin-welcome':      'Configura el mensaje de bienvenida del grupo',

  // BÚSQUEDA
  'busqueda-igstalk':       'Consulta información de un perfil de Instagram',
  'busqueda-imagen':        'Busca imágenes en Google',
  'busqueda-letra':         'Busca la letra de una canción',
  'busqueda-pinterest':     'Busca imágenes en Pinterest',
  'busqueda-tiktoksearch':  'Busca videos en TikTok',
  'busqueda-tiktokstalk':   'Consulta información de un perfil de TikTok',
  'busquedas-pinvideo':     'Descarga videos de Pinterest',
  'busquedas-ytsearch':     'Busca videos en YouTube',

  // DESCARGAS
  'descargas-apk':        'Descarga APKs desde APKPure',
  'descargas-facebook':   'Descarga videos de Facebook',
  'descargas-instagram':  'Descarga fotos y videos de Instagram',
  'descargas-mediafire':  'Descarga archivos de Mediafire',
  'descargas-mp3-y2mate': 'Descarga audio de YouTube en MP3',
  'descargas-mp4-y2mate': 'Descarga videos de YouTube en MP4',
  'descargas-pinterest':  'Descarga imágenes de Pinterest',
  'descargas-play':       'Reproduce y descarga música',
  'descargas-play2':      'Reproduce y descarga música (alternativo)',
  'descargas-spotify':    'Descarga canciones de Spotify',
  'descargas-tiktok':     'Descarga videos de TikTok sin marca de agua',
  'descargas-twitter':    'Descarga videos de Twitter/X',

  // DIVERSIÓN
  'diversion-abrazar':   'Envía un gif de abrazo a alguien',
  'diversion-acariciar': 'Envía un gif de caricias a alguien',
  'diversion-bailar':    'Envía un gif de baile',
  'diversion-bastardo':  'Envía un gif de bastardo',
  'diversion-besar':     'Envía un gif de beso a alguien',
  'diversion-bully':     'Envía un gif de bully a alguien',
  'diversion-cachetada': 'Envía un gif de cachetada a alguien',
  'diversion-cringe':    'Envía un gif de cringe',
  'diversion-enojado':   'Envía un gif de enojo',
  'diversion-feliz':     'Envía un gif de felicidad',
  'diversion-gay':       'Envía un gif gay',
  'diversion-golpear':   'Envía un gif de golpe a alguien',
  'diversion-lesbiana':  'Envía un gif lésbico',
  'diversion-llorar':    'Envía un gif de llanto',
  'diversion-mimos':     'Envía un gif de mimos a alguien',
  'diversion-morder':    'Envía un gif de mordida a alguien',
  'diversion-pena':      'Envía un gif de pena ajena',
  'diversion-pendeja':   'Envía un gif de pendeja',
  'diversion-puta':      'Envía un gif de puta',
  'diversion-tierno':    'Envía un gif tierno',

  // MAIN
  'main-config':    'Muestra la configuración actual del bot',
  'main-disable':   'Desactiva un comando en el grupo',
  'main-enable':    'Activa un comando en el grupo',
  'main-id-user':   'Muestra el ID de un usuario',
  'main-menu':      'Muestra todos los comandos disponibles',
  'main-ping':      'Comprueba si el bot está activo',
  'main-reporte':   'Envía un reporte al dueño del bot',

  // NSFW
  'nsfw-coreanas':      'Envía fotos de chicas coreanas',
  'nsfw-gelbooru':      'Busca imágenes en Gelbooru',
  'nsfw-hentai':        'Envía imágenes hentai aleatorias',
  'nsfw-random-girls':  'Envía fotos de chicas aleatorias',
  'nsfw-random':        'Envía contenido +18 aleatorio',
  'nsfw-test':          'Prueba el módulo NSFW',
  'nsfw-tetas':         'Envía imágenes +18 aleatorias',
  'nsfw-xnxxdl':        'Descarga videos de XNXX',
  'nsfw-xnxxsearch':    'Busca videos en XNXX',
  'nsfw-xvideosdl':     'Descarga videos de XVideos',
  'nsfw-xvideosearch':  'Busca videos en XVideos',

  // OWNER
  'owner-apagar':    'Apaga el bot',
  'owner-ban':       'Banea a un usuario de todos los grupos',
  'owner-banlist':   'Muestra la lista de usuarios baneados',
  'owner-broadcast': 'Envía un mensaje a todos los grupos',
  'owner-db':        'Gestiona la base de datos del bot',
  'owner-estado':    'Publica un estado en WhatsApp',
  'owner-prefix':    'Cambia el prefijo del bot',
  'owner-reiniciar': 'Reinicia el bot',
  'owner-restaurar': 'Restaura la base de datos',
  'owner-salir':     'Hace que el bot salga de un grupo',
  'owner-setimg':    'Cambia la imagen por defecto del bot',
  'owner-setowner':  'Cambia el número del dueño del bot',
  'owner-unban':     'Desbanea a un usuario',

  // UTILIDADES
  'utilidades-hd':        'Mejora la resolución de una imagen',
  'utilidades-logos':     'Crea logos con texto personalizado',
  'utilidades-shazam':    'Identifica una canción por audio',
  'utilidades-stickers':  'Convierte imágenes o videos a sticker',
  'utilidades-toimg':     'Convierte un sticker a imagen',
  'utilidades-tomp3':     'Extrae el audio de un video',
  'utilidades-tovideo':   'Convierte un sticker a video',
  'utilidades-ver':       'Muestra mensajes de vista única',
  'utilidades-wallpaper': 'Busca y envía wallpapers',
  'utilidades-wm':        'Agrega marca de agua a una imagen',
}

// ── Main ─────────────────────────────────────────────────────────────────────
const DIR   = process.argv[2] || './plugins'
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js'))

let actualizados = 0
let sinDesc      = 0
let limpios      = 0

for (const file of files) {
  const filePath = path.join(DIR, file)
  const original = fs.readFileSync(filePath, 'utf8')
  const nombre   = path.basename(file, '.js')

  // Solo actuar si tiene descripcion vacía
  if (!/descripcion\s*:\s*''/.test(original)) {
    console.log(`⏭️  omitido   → ${file}`)
    limpios++
    continue
  }

  const desc = MAPA[nombre]

  if (!desc) {
    console.log(`❓ sin mapeo  → ${file}  (agrégalo al diccionario)`)
    sinDesc++
    continue
  }

  const modificado = original.replace(
    /descripcion\s*:\s*''/,
    `descripcion: '${desc}'`
  )

  fs.writeFileSync(filePath, modificado, 'utf8')
  console.log(`✅ listo      → ${file}  →  "${desc}"`)
  actualizados++
}

console.log(`\n📊 Resumen: ${actualizados} actualizados · ${limpios} omitidos · ${sinDesc} sin mapeo · ${files.length} archivos totales`)