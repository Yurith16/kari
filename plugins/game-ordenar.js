// plugins/ordena.js
import { addKryons, addXp, getUser, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()
const palabras = ['programacion', 'tecnologia', 'ingenieria', 'honduras', 'robotica', 'inteligencia', 'servidor', 'bot']

function desordenar(palabra) {
    return palabra.split('').sort(() => Math.random() - 0.5).join('')
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

        const palabrasUsuario = text?.trim().toLowerCase().split(/\s+/)
        const respuesta = palabrasUsuario[0]
        if (!respuesta) return

        const esCancelar = respuesta === 'cancelar'
        const esPista = respuesta === 'pista'
        
        if (!esCancelar && !esPista && palabrasUsuario.length > 1) return

        if (esCancelar) {
            sesiones.delete(userNum)
            await sock.sendMessage(from, { text: '🌿 Juego cancelado.' }, { quoted: msg })
            return
        }

        if (esPista) {
            const eco = getEconomy(userNum)
            if ((eco.kryons || 0) < 20) {
                await sock.sendMessage(from, { text: '🌸 No tienes suficientes kryons (Costo: 20).' }, { quoted: msg })
                return
            }
            if (sesion.pistasCompradas >= 2) {
                await sock.sendMessage(from, { text: '🌸 Ya has usado el límite de 2 pistas.' }, { quoted: msg })
                return
            }

            // Incrementamos el contador ANTES para asegurar el bloqueo de la siguiente petición
            sesion.pistasCompradas++
            addKryons(userNum, -20)
            
            const letra = sesion.palabraOriginal[sesion.pistasCompradas - 1]
            await sock.sendMessage(from, { text: `> 💡 *Pista #${sesion.pistasCompradas}:* La letra es *${letra.toUpperCase()}*.` }, { quoted: msg })
            return
        }

        if (respuesta === sesion.palabraOriginal) {
            addKryons(userNum, 100)
            addXp(userNum, 20)
            sesiones.delete(userNum)
            await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
            await sock.sendMessage(from, { text: `> 🌸 *¡CORRECTO!* 🌸\n> ✦ Ganaste *100 kryons* + *20 XP* ✨` }, { quoted: msg })
        } else {
            sesion.intentos--
            if (sesion.intentos <= 0) {
                sesiones.delete(userNum)
                await sock.sendMessage(from, { react: { text: '💔', key: msg.key } })
                await sock.sendMessage(from, { text: `> 🌸 *GAME OVER* 🌸\n> ✦ La palabra era: *${sesion.palabraOriginal}*` }, { quoted: msg })
            } else {
                await sock.sendMessage(from, { text: `> 🌸 *INCORRECTO* 🌸\n> ✦ Te quedan *${sesion.intentos}* intentos.\n> ✦ Usa *pista* (-20 kryons) si necesitas ayuda.` }, { quoted: msg })
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
            await sock.sendMessage(from, { text: '🌸 Ya tienes un juego activo. Termínalo o escribe *cancelar*.' }, { quoted: msg })
            return
        }

        const palabraOriginal = palabras[Math.floor(Math.random() * palabras.length)]
        const palabraDesordenada = desordenar(palabraOriginal)

        sesiones.set(selfNum, {
            palabraOriginal,
            intentos: 3,
            pistasCompradas: 0
        })

        await sock.sendMessage(from, {
            text: `> 🌸 *ORDENA LA PALABRA* 🌸\n\n> ✦ Palabra: *${palabraDesordenada.toUpperCase()}*\n> ✦ Intentos: 3\n\n> 🌿 Responde con la palabra correcta, escribe *pista* o *cancelar*.`
        }, { quoted: msg })
    }
}