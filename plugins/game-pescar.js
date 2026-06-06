// plugins/pescar.js
import { addKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const cooldowns = new Map()

const peces = [
    // Comunes
    { n: 'Sardina Plateada 🐟', k: 40, x: 8, r: 'comun' },
    { n: 'Anchoveta del Pacífico 🐟', k: 45, x: 9, r: 'comun' },
    { n: 'Caballa Azul 🐟', k: 50, x: 10, r: 'comun' },
    { n: 'Arenque del Atlántico 🐟', k: 55, x: 11, r: 'comun' },
    { n: 'Jurel Común 🐟', k: 60, x: 12, r: 'comun' },
    { n: 'Tilapia de Río 🐟', k: 65, x: 13, r: 'comun' },
    { n: 'Trucha Arcoíris 🐟', k: 70, x: 14, r: 'comun' },
    { n: 'Carpa Dorada 🐟', k: 75, x: 15, r: 'comun' },

    // Raros
    { n: 'Pez Globo Espinoso 🐡', k: 130, x: 26, r: 'raro' },
    { n: 'Cangrejo de Roca 🦀', k: 145, x: 29, r: 'raro' },
    { n: 'Langosta Azul 🦞', k: 160, x: 32, r: 'raro' },
    { n: 'Pez León Venenoso 🪓', k: 175, x: 35, r: 'raro' },
    { n: 'Salmón Real 🐟', k: 190, x: 38, r: 'raro' },
    { n: 'Anguila Eléctrica 🐍', k: 210, x: 42, r: 'raro' },
    { n: 'Pez Cirujano Azul 🐠', k: 230, x: 46, r: 'raro' },
    { n: 'Pulpo de Anillos Azules 🐙', k: 250, x: 50, r: 'raro' },

    // Épicos
    { n: 'Calamar de las Profundidades 🦑', k: 420, x: 84, r: 'epico' },
    { n: 'Manta Raya Gigante 🐋', k: 460, x: 92, r: 'epico' },
    { n: 'Pez Espada Dorado ⚔️', k: 500, x: 100, r: 'epico' },
    { n: 'Atún de Aleta Azul 🐟', k: 550, x: 110, r: 'epico' },
    { n: 'Tiburón Martillo 🦈', k: 600, x: 120, r: 'epico' },
    { n: 'Barracuda Plateada 🐟', k: 650, x: 130, r: 'epico' },

    // Legendarios
    { n: 'Tiburón Blanco Ancestral 🦈', k: 1100, x: 220, r: 'legendario' },
    { n: 'Megalodón Joven 🦈', k: 1300, x: 260, r: 'legendario' },
    { n: 'Pez Remo Real 🐉', k: 1500, x: 300, r: 'legendario' },
    { n: 'Kraken Mitológico 🐙', k: 2200, x: 440, r: 'legendario' },
    { n: 'Leviatán Marino 🐉', k: 3000, x: 600, r: 'legendario' }
]

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}

function obtenerPezPorProbabilidad() {
    const seed = Math.random()
    let poolRareza = []
    if (seed < 0.55) poolRareza = peces.filter(p => p.r === 'comun')
    else if (seed < 0.85) poolRareza = peces.filter(p => p.r === 'raro')
    else if (seed < 0.97) poolRareza = peces.filter(p => p.r === 'epico')
    else poolRareza = peces.filter(p => p.r === 'legendario')
    return poolRareza[Math.floor(Math.random() * poolRareza.length)]
}

export default {
    command: ['pescar', 'pese', 'fish'],
    tag: 'juegos',
    categoria: 'juego',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: '🌸 Lanza la caña al mar para intentar capturar especies',

    async execute(sock, msg, { from, userNum, sender }) {
        const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
        const selfNum = cleanNumber(selfJid)

        if (!isRegistered(selfNum)) {
            return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
        }

        const tiempoEspera = 10 * 60 * 1000
        const ultimoGiro = cooldowns.get(selfNum) || 0
        const ahora = Date.now()

        if (ahora - ultimoGiro < tiempoEspera) {
            const tiempoRestante = msToTime(tiempoEspera - (ahora - ultimoGiro))
            return sock.sendMessage(from, { text: `> 🌸 Marea baja. Espera *${tiempoRestante}* para volver.` }, { quoted: msg })
        }

        cooldowns.set(selfNum, ahora)
        await sock.sendMessage(from, { react: { text: '🎣', key: msg.key } })

        if (Math.random() < 0.25) {
            return sock.sendMessage(from, { text: `> 🌊 *Pesca Fallida* ➜ El pez se comió la carnada y escapó.` }, { quoted: msg })
        }

        const cantidadPeces = Math.floor(Math.random() * 4) + 1
        let totalKryonsGana = 0
        let totalXpGana = 0
        const listadoPeces = []

        for (let i = 0; i < cantidadPeces; i++) {
            const pez = obtenerPezPorProbabilidad()
            const variacionK = Math.floor(Math.random() * (20 - 5 + 1)) + 5
            totalKryonsGana += pez.k + variacionK
            totalXpGana += pez.x + Math.floor(variacionK / 4)
            listadoPeces.push(pez.n)
        }

        addKryons(selfNum, totalKryonsGana)
        addXp(selfNum, totalXpGana)

        let txtExito = `> 🎣 *BUENA PESCA DEL DÍA*\n`
        txtExito += `───────────────\n`
        txtExito += `> 🐟 *Especies:* ${listadoPeces.join(', ')}\n`
        txtExito += `> 💎 *Botín:* +${totalKryonsGana} kryons | +${totalXpGana} XP`

        await sock.sendMessage(from, { text: txtExito }, { quoted: msg })
    }
}