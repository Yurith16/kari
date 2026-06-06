// plugins/tragamonedas.js
import { addKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

// Se conservan tus emojis originales de frutas y objetos
const slots = ['🍒', '💎', '🍋', '🎰', '🍀', '🍇']

const frasesVictoria = [
    "¡La suerte está de tu lado!",
    "Las estrellas se alinearon a tu favor.",
    "Te estás volviendo millonario a mi costa.",
    "El casino de Midori invita la ronda."
]

const frasesDerrota = [
    "La máquina se ha quedado con tu apuesta.",
    "La próxima ronda seguro es la tuya.",
    "Mejor suerte para la próxima.",
    "La casa siempre gana... No te rindas."
]

export default {
    command: ['tragamonedas', 'slots', 'slot', 'apostar'],
    tag: 'slot',
    categoria: 'economia',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: '🌸 Apuesta tus kryons en la máquina tragamonedas',

    async execute(sock, msg, { from, userNum, sender, args }) {
        const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
        const selfNum = cleanNumber(selfJid)

        if (!isRegistered(selfNum)) {
            return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
        }

        if (!args[0]) {
            return sock.sendMessage(from, { text: '🌸 Especifica cuánto vas a apostar. Ejemplo: *.slots 100*' }, { quoted: msg })
        }

        const eco = getEconomy(selfNum)
        let apuesta = 0

        if (args[0].toLowerCase() === 'all') {
            apuesta = eco.kryons || 0
        } else {
            apuesta = parseInt(args[0])
        }

        if (isNaN(apuesta) || apuesta <= 0) {
            return sock.sendMessage(from, { text: '🌸 Ingresa una cantidad válida de kryons.' }, { quoted: msg })
        }

        if (apuesta < 10) {
            return sock.sendMessage(from, { text: '🌸 La apuesta mínima es de 10 kryons.' }, { quoted: msg })
        }

        if ((eco.kryons || 0) < apuesta) {
            return sock.sendMessage(from, { text: `🌸 Fondos insuficientes. Tu saldo es de *${eco.kryons || 0} kryons*.` }, { quoted: msg })
        }

        await sock.sendMessage(from, { react: { text: '🎰', key: msg.key } })

        // --- LÓGICA DE GIRO Y ROTACIÓN DEL SISTEMA SOLICITADO ---
        let a = Math.floor(Math.random() * slots.length)
        let b = Math.floor(Math.random() * slots.length)
        let c = Math.floor(Math.random() * slots.length)

        const x = []
        const y = []
        const z = []

        // Rodillo 1
        for (let i = 0; i < 3; i++) {
            x[i] = slots[a]
            a++
            if (a == slots.length) a = 0
        }
        // Rodillo 2
        for (let i = 0; i < 3; i++) {
            y[i] = slots[b]
            b++
            if (b == slots.length) b = 0
        }
        // Rodillo 3
        for (let i = 0; i < 3; i++) {
            z[i] = slots[c]
            c++
            if (c == slots.length) c = 0
        }

        const tituloApuestas = toBold('SLOTS')
        let end = ''

        // El resultado se dictamina evaluando los índices base elegidos para cada columna
        if (a == b && b == c) {
            const gananciaNetas = apuesta * 2 
            const xpGanada = Math.floor(apuesta / 2)
            addKryons(selfNum, gananciaNetas)
            addXp(selfNum, xpGanada)

            const fraseV = frasesVictoria[Math.floor(Math.random() * frasesVictoria.length)]
            end += `🌸 *${fraseV}*\n`
            end += `> ✦ Premio Triple: *+${apuesta * 3} kryons* ✨\n`
            end += `> ✦ Exp: *+${xpGanada} XP*`

        } else if (a == b || a == c || b == c) {
            const gananciaNetas = Math.floor(apuesta * 0.5) 
            const xpGanada = Math.floor(apuesta / 4)
            addKryons(selfNum, gananciaNetas)
            addXp(selfNum, xpGanada)

            end += `🌸 *Coincidencia doble.*\n`
            end += `> ✦ Premio: *+${Math.floor(apuesta * 1.5)} kryons* 🎉\n`
            end += `> ✦ Exp: *+${xpGanada} XP*`

        } else {
            addKryons(selfNum, -apuesta)

            const fraseD = frasesDerrota[Math.floor(Math.random() * frasesDerrota.length)]
            end += `🌸 *${fraseD}*\n`
            end += `> ✦ Perdiste: *-${apuesta} kryons*`
        }

        // --- DISEÑO VISUAL ADAPTADO ---
        // La cabecera y el bloque final llevan '>', la matriz limpia con separadores limpios
        let txt = `> 🎰 *${tituloApuestas}* 🎰\n`
        txt += `────────\n`
        txt += `${x[0]} : ${y[0]} : ${z[0]}\n`
        txt += `${x[1]} : ${y[1]} : ${z[1]}\n`
        txt += `${x[2]} : ${y[2]} : ${z[2]}\n`
        txt += `────────\n`
        txt += `> 🎰 | ${end}`

        await sock.sendMessage(from, { text: txt }, { quoted: msg })
    }
}