// plugins/ahorcado.js
import { addKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

const sesiones = new Map()
const palabras = ['programacion', 'tecnologia', 'ingenieria', 'honduras', 'robotica', 'inteligencia', 'servidor', 'bot', 'javascript', 'algoritmo']

const frasesInicio = [
    "¡Comienza el juego del ahorcado! Adivina la palabra letra por letra.",
    "¿Podrás descubrir la palabra oculta antes de que sea tarde?",
    "Demuestra tu vocabulario. ¡Buena suerte!"
]

const frasesVictoria = [
    "¡Increíble! Descubriste la palabra *{palabra}*. Te has salvado.",
    "¡Completamente correcto! La palabra era *{palabra}*. ¡Excelente juego!"
]

const frasesDerrota = [
    "¡Te has quedado sin vidas! La palabra correcta era *{palabra}*.",
    "Fin del juego. No lograste adivinar y la palabra era *{palabra}*."
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
    descripcion: '🌸 Juega al ahorcado adivinando la palabra oculta',

    async onMessage(sock, msg, { from, text, userNum }) {
        const sesion = sesiones.get(userNum)
        if (!sesion) return

        // --- FILTRO ANTISPAM / COOLDOWN ---
        const ahora = Date.now()
        if (sesion.ultimoMensaje && (ahora - sesion.ultimoMensaje < 1200)) {
            return
        }
        sesion.ultimoMensaje = ahora

        const entrada = text?.trim().toLowerCase()
        if (!entrada) return

        if (entrada === 'cancelar') {
            sesiones.delete(userNum)
            await sock.sendMessage(from, { text: '> 🌸 Juego cancelado. ¡Nos vemos luego!' }, { quoted: msg })
            return
        }

        // --- VALIDACIÓN ESTRICTA: SOLO UNA LETRA ---
        if (entrada.length !== 1 || !/[a-zñ]/.test(entrada)) {
            return
        }

        const letraLimpia = normalizarTexto(entrada)

        if (sesion.letrasUsadas.includes(letraLimpia)) {
            await sock.sendMessage(from, { text: `> 🌸 Ya habías intentado con la letra *${entrada.toUpperCase()}*. Prueba otra.` }, { quoted: msg })
            return
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

        const tituloAhorcado = toBold('AHORCADO')
        const letrasFormateadas = sesion.letrasUsadas.join(', ').toUpperCase()

        if (acierto) {
            if (!sesion.progreso.includes('_')) {
                const premioKryons = Math.floor(Math.random() * (400 - 200 + 1)) + 200
                const premioXp = Math.floor(premioKryons / 5)

                addKryons(userNum, premioKryons)
                addXp(userNum, premioXp)
                sesiones.delete(userNum)

                const msgV = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)].replace('{palabra}', sesion.palabraOriginal)
                
                let txtWin = `> 🎯 *${tituloAhorcado}* 🎯\n\n`
                txtWin += `${sesion.progreso.join(' ').toUpperCase()}\n\n`
                txtWin += `> 🌸 *${msgV}*\n`
                txtWin += `> 📚 Letras usadas: ${letrasFormateadas}\n`
                txtWin += `> ✦ Recompensa: *+${premioKryons} kryons* ✨\n`
                txtWin += `> ✦ Exp: *+${premioXp} XP*`
                
                await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
                await sock.sendMessage(from, { text: txtWin }, { quoted: msg })
            } else {
                let txtAcierto = `> 🎯 *${tituloAhorcado}* 🎯\n\n`
                txtAcierto += `${sesion.progreso.join(' ').toUpperCase()}\n\n`
                txtAcierto += `> 🌸 ¡Buen tiro! La letra *${entrada.toUpperCase()}* sí forma parte de la palabra.\n`
                txtAcierto += `> 📚 Letras usadas: ${letrasFormateadas}\n`
                txtAcierto += `> 🌿 Vidas: ${'🍃'.repeat(sesion.intentos)}${'🍂'.repeat(5 - sesion.intentos)}`
                
                await sock.sendMessage(from, { text: txtAcierto }, { quoted: msg })
            }
        } else {
            sesion.intentos--

            if (sesion.intentos <= 0) {
                sesiones.delete(userNum)
                const msgD = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)].replace('{palabra}', sesion.palabraOriginal)
                
                let txtFails = `> 🎯 *${tituloAhorcado}* 🎯\n\n`
                txtFails += `${sesion.palabraOriginal.toUpperCase()}\n\n`
                txtFails += `> 🌸 *${msgD}*\n`
                txtFails += `> 📚 Letras usadas: ${letrasFormateadas}\n`
                txtFails += `> 🍂 Vidas: ${'🍂'.repeat(5)}`

                await sock.sendMessage(from, { react: { text: '☠️', key: msg.key } })
                await sock.sendMessage(from, { text: txtFails }, { quoted: msg })
            } else {
                let txtFallo = `> 🎯 *${tituloAhorcado}* 🎯\n\n`
                txtFallo += `${sesion.progreso.join(' ').toUpperCase()}\n\n`
                txtFallo += `> 🌸 La letra *${entrada.toUpperCase()}* no se encuentra en la palabra.\n`
                txtFallo += `> 📚 Letras usadas: ${letrasFormateadas}\n`
                txtFallo += `> 🌿 Vidas: ${'🍃'.repeat(sesion.intentos)}${'🍂'.repeat(5 - sesion.intentos)}`

                await sock.sendMessage(from, { text: txtFallo }, { quoted: msg })
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
            return sock.sendMessage(from, { text: '🌸 Ya tienes una partida de ahorcado activa. Termínala o escribe *cancelar*.' }, { quoted: msg })
        }

        const palabraOriginal = palabras[Math.floor(Math.random() * palabras.length)]
        const progreso = Array(palabraOriginal.length).fill('_')

        sesiones.set(selfNum, {
            palabraOriginal,
            progreso,
            intentos: 5, // Ajustado a 5 vidas balanceadas
            letrasUsadas: [],
            ultimoMensaje: 0
        })

        const tituloAhorcado = toBold('AHORCADO')
        const frase = frasesInicio[Math.floor(Math.random() * frasesInicio.length)]

        let txtInicio = `> 🎯 *${tituloAhorcado}* 🎯\n\n`
        txtInicio += `${progreso.join(' ')}\n\n`
        txtInicio += `> 🌸 ${frase}\n`
        txtInicio += `> 🌿 Vidas: 🍃 🍃 🍃 🍃 🍃\n\n`
        txtInicio += `> 🌿 Envía una letra para jugar o escribe *cancelar*.`

        await sock.sendMessage(from, { text: txtInicio }, { quoted: msg })
    }
}