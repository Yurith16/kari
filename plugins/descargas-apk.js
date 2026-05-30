// plugins/apk.js
import axios from 'axios'

const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Referer': 'https://es.aptoide.com/',
  'Origin': 'https://es.aptoide.com'
}

const sesiones = new Map()
const div = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

async function searchApps(query, limit = 10) {
  const url = 'https://ws2-cache.aptoide.com/api/7/apps/search'
  const params = {
    query: query,
    limit: limit,
    offset: 0,
    language: 'es_ES',
    country: 'HN',
    mature: false,
    aab: 1,
    cdn: 'web'
  }

  const res = await axios.get(url, { headers, params })
  
  if (!res.data?.datalist?.list?.length) return []
  
  return res.data.datalist.list.map(app => ({
    id: app.id,
    name: app.name,
    package: app.package,
    uname: app.uname,
    size: app.size,
    downloads: app.stats?.downloads,
    rating: app.stats?.rating?.avg
  }))
}

async function getDownloadUrl(uname) {
  const url = 'https://ws2-cache.aptoide.com/api/7/app/getMeta'
  const params = {
    cdn: 'web',
    aab: 1,
    mature: false,
    language: 'en_US',
    country: 'gb',
    package_uname: uname,
    store_name: 'aptoide-web'
  }

  const res = await axios.get(url, { headers, params })
  return res.data?.data?.file?.path || null
}

export default {
  command: ['apk'],
  tag: 'apk',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: '🌸 Busca y descarga APKs desde Aptoide',

  async onMessage(sock, msg, { from, text, userNum }) {
    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (respuesta.toLowerCase() === 'cancelar') {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌿 Búsqueda cancelada.' }, { quoted: msg })
      return
    }

    if (sesion.paso === 1) {
      const idx = parseInt(respuesta) - 1
      if (isNaN(idx) || idx < 0 || idx >= sesion.resultados.length) {
        await sock.sendMessage(from, { text: '🌿 Responde con el número de la app.' }, { quoted: msg })
        return
      }

      const app = sesion.resultados[idx]
      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      try {
        const downloadUrl = await getDownloadUrl(app.uname)
        
        if (!downloadUrl) {
          await sock.sendMessage(from, { text: `🌿 No se pudo obtener el link de ${app.name}.` }, { quoted: msg })
          sesiones.delete(userNum)
          return
        }

        const response = await axios({
          method: 'GET',
          url: downloadUrl,
          headers,
          responseType: 'arraybuffer',
          timeout: 120000
        })

        const apkBuffer = Buffer.from(response.data)
        const sizeMB = (apkBuffer.length / (1024 * 1024)).toFixed(2)
        
        await sock.sendMessage(from, {
          document: apkBuffer,
          mimetype: 'application/vnd.android.package-archive',
          fileName: `${app.name.toLowerCase().replace(/ /g, '_')}.apk`,
          caption: `🌸 *${app.name}*\n📦 Tamaño: ${sizeMB} MB\n📱 Package: ${app.package}`
        }, { quoted: msg })

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
        sesiones.delete(userNum)

      } catch (error) {
        console.error('APK error:', error.message)
        await sock.sendMessage(from, { text: '🌿 Error al descargar.' }, { quoted: msg })
        sesiones.delete(userNum)
      }
    }
  },

  async execute(sock, msg, { from, args, userNum }) {
    // Si el usuario tiene una búsqueda activa, la cancelamos automáticamente
    if (sesiones.has(userNum)) {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌿 Búsqueda anterior cancelada. Iniciando nueva...' }, { quoted: msg })
    }

    if (!args.length) {
      return sock.sendMessage(from, { 
        text: '🌸 ¿Qué app quieres descargar?\n\n> ✦ .apk facebook lite\n> ✦ .apk spotify'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    
    await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

    try {
      const results = await searchApps(query, 10)
      
      if (!results.length) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        return sock.sendMessage(from, { text: `🌿 No encontré "${query}". Intenta con otro nombre.` }, { quoted: msg })
      }

      if (results.length === 1) {
        const app = results[0]
        await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })
        
        const downloadUrl = await getDownloadUrl(app.uname)
        
        if (!downloadUrl) {
          await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
          return sock.sendMessage(from, { text: `🌿 No se pudo obtener el link de ${app.name}.` }, { quoted: msg })
        }

        const response = await axios({
          method: 'GET',
          url: downloadUrl,
          headers,
          responseType: 'arraybuffer',
          timeout: 120000
        })

        const apkBuffer = Buffer.from(response.data)
        const sizeMB = (apkBuffer.length / (1024 * 1024)).toFixed(2)
        
        await sock.sendMessage(from, {
          document: apkBuffer,
          mimetype: 'application/vnd.android.package-archive',
          fileName: `${app.name.toLowerCase().replace(/ /g, '_')}.apk`,
          caption: `🌸 *${app.name}*\n📦 Tamaño: ${sizeMB} MB\n📱 Package: ${app.package}`
        }, { quoted: msg })

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
        return
      }

      // Múltiples resultados con diseño superior
      let txt = `🌿 *Elige una app*\n> Responde con el número del 1 al ${results.length}\n> O escribe "cancelar"\n\n${div}\n\n`
      
      results.forEach((app, i) => {
        const sizeMB = (app.size / (1024 * 1024)).toFixed(2)
        const rating = app.rating ? `⭐ ${app.rating}` : `⭐ Sin valorar`
        txt += `✦ ${i + 1}. *${app.name}*\n`
        txt += `  > 📦 ${sizeMB} MB • ${rating}\n`
        txt += `  > 📱 ${app.package}\n\n`
      })
      
      txt += `${div}`

      sesiones.set(userNum, {
        paso: 1,
        resultados: results
      })

      await sock.sendMessage(from, { text: txt }, { quoted: msg })

    } catch (error) {
      console.error('APK error:', error.message)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: '🌿 Hubo un error. Intenta de nuevo.' }, { quoted: msg })
    }
  }
}