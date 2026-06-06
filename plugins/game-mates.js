// plugins/mates.js
import { addKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

// Dificultades reajustadas: operaciones más complejas y más tiempo de respuesta para pensar
const CONFIG_NIVELES = {
    facil: { tiempo: 40000, multi: 1, min: 10, max: 80, ops: ['+', '-'] },
    normal: { tiempo: 45000, multi: 1.8, min: 20, max: 150, ops: ['+', '-', '*'] },
    dificil: { tiempo: 50000, multi: 3.0, min: 50, max: 400, ops: ['*', '-'] }
}

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

function generarOperacion(nivel) {
    const conf = CONFIG_NIVELES[nivel]
    const op = conf.ops[Math.floor(Math.random() * conf.ops.length)]
    
    let n1 = Math.floor(Math.random() * (conf.max - conf.min + 1)) + conf.min
    let n2 = Math.floor(Math.random() * (conf.max - conf.min + 1)) + conf.min
    
    // Si es multiplicación en nivel difícil, escalamos un número para que sea un reto real pero justo
    if (op === '*' && nivel === 'dificil') {
        n1 = Math.floor(Math.random() * (40 - 12 + 1)) + 12
        n2 = Math.floor(Math.random() * (30 - 11 + 1)) + 11
    } else if (op === '*' && nivel === 'normal') {
        n1 = Math.floor(Math.random() * (20 - 5 + 1)) + 5
        n2 = Math.floor(Math.random() * (12 - 4 + 1)) + 4
    }

    if (op === '-' && n2 > n1) {
        [n1, n2] = [n2, n1]
    }

    let resultado
    switch (op) {
        case '+': resultado = n1 + n2; break
        case '-': resultado = n1 - n2; break
        case '*': resultado = n1 * n2; break
    }

    return {
        pregunta: `${n1} ${op} ${n2}`,
        resultado: resultado
    }
}

export default {
    command: ['mates', 'matematicas', 'calculo'],
    tag: 'juegos',
    categoria: 'juego',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: '🌸 Resuelve operaciones matemáticas contrarreloj',

    async onMessage(sock, msg, { from, text, userNum }) {
        const sesion = sesiones.get(userNum)
        if (!sesion) return

        const ahora = Date.now()
        if (sesion.ultimoMensaje && (ahora - sesion.ultimoMensaje < 1200)) {
            return
        }
        sesion.ultimoMensaje = ahora

        const entrada = text?.trim()
        if (!entrada) return

        if (entrada.toLowerCase() === 'cancelar') {
            if (sesion.timeoutId) clearTimeout(sesion.timeoutId)
            sesiones.delete(userNum)
            await sock.sendMessage(from, { text: '> 🌸 Juego cancelado. ¡Nos vemos luego!' }, { quoted: msg })
            return
        }

        if (ahora > sesion.limiteTiempo) return

        // --- VALIDACIÓN ESTRICTA: Solo números enteros (positivos o negativos) ---
        if (!/^-?\d+$/.test(entrada)) {
            return 
        }

        if (sesion.timeoutId) clearTimeout(sesion.timeoutId)
        const respuestaUsuario = parseInt(entrada)

        if (respuestaUsuario === sesion.resultadoCorrecto) {
            const conf = CONFIG_NIVELES[sesion.nivel]
            const baseKryons = Math.floor(Math.random() * (250 - 150 + 1)) + 150
            const premioKryons = Math.floor(baseKryons * conf.multi)
            const premioXp = Math.floor(premioKryons / 5)

            addKryons(userNum, premioKryons)
            addXp(userNum, premioXp)
            sesiones.delete(userNum)

            let txtWin = `> 🌸 ¡Excelente cálculo! Tu respuesta *${respuestaUsuario}* es correcta.\n\n`
            txtWin += `> ✦ Recompensa (${sesion.nivel}): *+${premioKryons} kryons* ✨\n`
            txtWin += `> ✦ Exp: *+${premioXp} XP*`

            await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
            await sock.sendMessage(from, { text: txtWin }, { quoted: msg })
        } else {
            const corrector = sesion.resultadoCorrecto
            sesiones.delete(userNum)

            let txtFail = `> 🌸 Respuesta incorrecta. El resultado real era *${corrector}*.\n\n`
            txtFail += `> 🌿 Sigue practicando tus habilidades de cálculo.`

            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
            await sock.sendMessage(from, { text: txtFail }, { quoted: msg })
        }
    },

    async execute(sock, msg, { from, userNum, sender, args }) {
        const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
        const selfNum = cleanNumber(selfJid)

        if (!isRegistered(selfNum)) {
            return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
        }

        if (sesiones.has(selfNum)) {
            return sock.sendMessage(from, { text: '🌸 Ya tienes un desafío matemático en curso.' }, { quoted: msg })
        }

        if (!args[0]) {
            let txtMenu = `> 🧮 *Desafío Numérico*\n\n`
            txtMenu += `> Elige tu dificultad usando el comando de las siguientes formas:\n\n`
            txtMenu += `*.mates facil*\n`
            txtMenu += `*.mates normal*\n`
            txtMenu += `*.mates dificil*`
            return sock.sendMessage(from, { text: txtMenu }, { quoted: msg })
        }

        const nivelElegido = normalizarTexto(args[0])

        if (!CONFIG_NIVELES[nivelElegido]) {
            return sock.sendMessage(from, { text: '🌸 Nivel no válido. Elige entre *facil*, *normal* o *dificil*.' }, { quoted: msg })
        }

        const operacion = generarOperacion(nivelElegido)
        const conf = CONFIG_NIVELES[nivelElegido]
        const ahora = Date.now()

        const timeoutId = setTimeout(async () => {
            const partidaActiva = sesiones.get(selfNum)
            if (partidaActiva) {
                sesiones.delete(selfNum)
                await sock.sendMessage(from, { text: `> 🌸 ¡Se acabó el tiempo! El resultado era *${operacion.resultado}*.` })
            }
        }, conf.tiempo)

        sesiones.set(selfNum, {
            nivel: nivelElegido,
            resultadoCorrecto: operacion.resultado,
            limiteTiempo: ahora + conf.tiempo,
            timeoutId: timeoutId,
            ultimoMensaje: 0
        })

        let txtPregunta = `> 🧮 *Operación Matemática (${nivelElegido})*\n\n`
        txtPregunta += `> 🌸 *${operacion.pregunta}*\n\n`
        txtPregunta += `> ⏱️ Tienes *${conf.tiempo / 1000} segundos* para responder con el número correcto.`

        await sock.sendMessage(from, { text: txtPregunta }, { quoted: msg })
    }
}