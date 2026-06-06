// plugins/cazar.js
import { addKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const cooldowns = new Map()

// Pool masivo de más de 100 animales clasificados por ecosistemas y rarezas internas
const animales = [
    // --- BOSQUES Y PRADERAS ---
    { n: 'Conejo Silvestre 🐇', k: 35, x: 7, r: 'comun' },
    { n: 'Ardilla Roja 🐿️', k: 38, x: 8, r: 'comun' },
    { n: 'Zorrillo Listado 🦨', k: 42, x: 8, r: 'comun' },
    { n: 'Mapache Norteño 🦝', k: 45, x: 9, r: 'comun' },
    { n: 'Castor de Río 🦫', k: 48, x: 9, r: 'comun' },
    { n: 'Comadreja Común 🦦', k: 50, x: 10, r: 'comun' },
    { n: 'Tejón Europeo 🦡', k: 52, x: 10, r: 'comun' },
    { n: 'Zorro Rojo 🦊', k: 70, x: 14, r: 'comun' },
    { n: 'Puercoespín 🦔', k: 75, x: 15, r: 'comun' },
    { n: 'Ciervo Cola Blanca 🦌', k: 90, x: 18, r: 'comun' },
    { n: 'Jabalí Berrendo 🐗', k: 95, x: 19, r: 'comun' },
    { n: 'Oso Negro Americano 🐻', k: 150, x: 30, r: 'raro' },
    { n: 'Lobo Gris 🐺', k: 165, x: 33, r: 'raro' },
    { n: 'Lince Ibérico 🐆', k: 180, x: 36, r: 'raro' },
    { n: 'Puma de la Montaña 🐆', k: 210, x: 42, r: 'raro' },
    { n: 'Alce Gigante 🦌', k: 240, x: 48, r: 'raro' },
    { n: 'Wolverine Territorial 🦡', k: 270, x: 54, r: 'raro' },
    { n: 'Oso Pardo Alfa 🐻', k: 450, x: 90, r: 'epico' },
    { n: 'Ciervo Sagrado Blanco 🦌', k: 520, x: 104, r: 'epico' },
    { n: 'Lobo Negro Solitario 🐺', k: 580, x: 116, r: 'epico' },

    // --- SELVAS Y TROPICOS ---
    { n: 'Iguana Verde 🦎', k: 40, x: 8, r: 'comun' },
    { n: 'Camaleón de Velo 🦎', k: 43, x: 8, r: 'comun' },
    { n: 'Mono Capuchino 🐒', k: 55, x: 11, r: 'comun' },
    { n: 'Tucán Toco 🦤', k: 60, x: 12, r: 'comun' },
    { n: 'Guacamaya Roja 🦜', k: 65, x: 13, r: 'comun' },
    { n: 'Perezoso de Tres Dedos 🦥', k: 70, x: 14, r: 'comun' },
    { n: 'Tamandúa Hormiguero 🦥', k: 72, x: 14, r: 'comun' },
    { n: 'Lémur de Cola Anillada 🦧', k: 78, x: 15, r: 'comun' },
    { n: 'Pavo Real Indio 🦚', k: 85, x: 17, r: 'comun' },
    { n: 'Coatí de Nariz Blanca 🦝', k: 88, x: 17, r: 'comun' },
    { n: 'Tapir Amazónico 🐗', k: 110, x: 22, r: 'comun' },
    { n: 'Capibara de Estero 🦫', k: 120, x: 24, r: 'comun' },
    { n: 'Boa Constrictora 🐍', k: 140, x: 28, r: 'raro' },
    { n: 'Chimpancé Inteligente 🐒', k: 160, x: 32, r: 'raro' },
    { n: 'Mandril de la Jungla 🦧', k: 170, x: 34, r: 'raro' },
    { n: 'Caimán de Anteojos 🐊', k: 195, x: 39, r: 'raro' },
    { n: 'Jaguar Manchado 🐆', k: 250, x: 50, r: 'raro' },
    { n: 'Pantera Negra 🐆', k: 280, x: 56, r: 'raro' },
    { n: 'Gorila de Montaña 🦍', k: 480, x: 96, r: 'epico' },
    { n: 'Tigre de Bengala 🐅', k: 550, x: 110, r: 'epico' },
    { n: 'Cocodrilo del Nilo 🐊', k: 600, x: 120, r: 'epico' },
    { n: 'Anaconda Amarilla Gigante 🐍', k: 650, x: 130, r: 'epico' },

    // --- SABANA Y DESIERTO ---
    { n: 'Suricata Vigía 🦦', k: 36, x: 7, r: 'comun' },
    { n: 'Jerbo del Desierto 🐁', k: 39, x: 8, r: 'comun' },
    { n: 'Correcaminos 🪶', k: 46, x: 9, r: 'comun' },
    { n: 'Coyote del Páramo 🐺', k: 68, x: 13, r: 'comun' },
    { n: 'Chacal de Lomo Negro 🦊', k: 72, x: 14, r: 'comun' },
    { n: 'Gacela de Thomson 🦌', k: 85, x: 17, r: 'comun' },
    { n: 'Fanal de Cola Gruesa 🦊', k: 90, x: 18, r: 'comun' },
    { n: 'Becerro del Desierto 🐂', k: 95, x: 19, r: 'comun' },
    { n: 'Avestruz Africano 🦤', k: 105, x: 21, r: 'comun' },
    { n: 'Impala Saltador 🦌', k: 115, x: 23, r: 'comun' },
    { n: 'Cebra de Sabana 🦓', k: 125, x: 25, r: 'comun' },
    { n: 'Hiena Manchada 🦧', k: 155, x: 31, r: 'raro' },
    { n: 'Camello Bactriano 🐫', k: 165, x: 33, r: 'raro' },
    { n: 'Dromedario Salvaje 🐪', k: 175, x: 35, r: 'raro' },
    { n: 'Búfalo de Agua 🐂', k: 200, x: 40, r: 'raro' },
    { n: 'Guepardo Veloz 🐆', k: 260, x: 52, r: 'raro' },
    { n: 'Leopardo de las Nieves 🐆', k: 290, x: 58, r: 'raro' },
    { n: 'Hipopótamo Territorial 🦛', k: 490, x: 98, r: 'epico' },
    { n: 'Rinoceronte Negro 🦏', k: 530, x: 106, r: 'epico' },
    { n: 'León de Melena Negra 🦁', k: 570, x: 114, r: 'epico' },
    { n: 'Elefante Africano 🐘', k: 620, x: 124, r: 'epico' },

    // --- REGIONES HELADAS Y TUNDRA ---
    { n: 'Ratón de Nieve 🐁', k: 35, x: 7, r: 'comun' },
    { n: 'Liebre Ártica 🐇', k: 44, x: 9, r: 'comun' },
    { n: 'Lemming de Tundra 🐁', k: 46, x: 9, r: 'comun' },
    { n: 'Pingüino Emperador 🐧', k: 65, x: 13, r: 'comun' },
    { n: 'Búho Nival 🪶', k: 70, x: 14, r: 'comun' },
    { n: 'Zorro Ártico 🦊', k: 85, x: 17, r: 'comun' },
    { n: 'Puffin Atlántico 🐧', k: 90, x: 18, r: 'comun' },
    { n: 'Foca Monje 🦭', k: 135, x: 27, r: 'raro' },
    { n: 'Morsa de Colmillos Largos 🦭', k: 185, x: 37, r: 'raro' },
    { n: 'Lobo de Tundra 🐺', k: 220, x: 44, r: 'raro' },
    { n: 'Reno de la Tundra 🦌', k: 235, x: 47, r: 'raro' },
    { n: 'Buey Almizclero 🐂', k: 265, x: 53, r: 'raro' },
    { n: 'Oso Polar Alfa 🐻❄️', k: 560, x: 112, r: 'epico' },

    // --- LEGENDARIOS ---
    { n: 'Ciervo Albino de la Suerte 🦌✨', k: 1200, x: 240, r: 'legendario' },
    { n: 'Lobo de Ojos Carmesí 🐺🩸', k: 1400, x: 280, r: 'legendario' },
    { n: 'Chupacabras de las Sombras 👤', k: 1650, x: 330, r: 'legendario' },
    { n: 'Yeti de las Nieves 🦍❄️', k: 1900, x: 380, r: 'legendario' },
    { n: 'Sasquatch de los Pirineos 🦍🌲', k: 2100, x: 420, r: 'legendario' },
    { n: 'Pantera de Sombras Esmeralda 🐆👁️', k: 2400, x: 480, r: 'legendario' },
    { n: 'Tigre Blanco Espiritual 🐅🔮', k: 2600, x: 520, r: 'legendario' },
    { n: 'León Celestial Dorado 🦁👑', k: 2900, x: 580, r: 'legendario' },
    { n: 'Grifo de las Cumbres 🦅🦁', k: 3200, x: 640, r: 'legendario' },
    { n: 'Minotauro de Laberinto 🐂🛡️', k: 3500, x: 700, r: 'legendario' },
    { n: 'Pegaso Salvaje 🐴🪶', k: 3800, x: 760, r: 'legendario' },
    { n: 'Cerbero del Inframundo 🐕🔥', k: 4200, x: 840, r: 'legendario' },
    { n: 'Basilisco de Escamas Negras 🐍💀', k: 4500, x: 900, r: 'legendario' },
    { n: 'Quimera de Fuego 🦁🐍🐐', k: 4800, x: 960, r: 'legendario' },
    { n: 'Fénix Inmortal 🦅🔥', k: 5200, x: 1040, r: 'legendario' },
    { n: 'Mamut Lanudo Resucitado 🐘🪨', k: 5500, x: 1100, r: 'legendario' },
    { n: 'Dragón de Tierra Joven 🐉🤎', k: 6000, x: 1200, r: 'legendario' },
    { n: 'Dragón de Escarcha 🐉❄️', k: 6500, x: 1300, r: 'legendario' },
    { n: 'Dragón Negro Ancestral 🐉🖤', k: 8000, x: 1600, r: 'legendario' }
]

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}

function obtenerAnimalPorProbabilidad() {
    const seed = Math.random()
    let poolRareza = []
    if (seed < 0.60) poolRareza = animales.filter(a => a.r === 'comun')
    else if (seed < 0.86) poolRareza = animales.filter(a => a.r === 'raro')
    else if (seed < 0.98) poolRareza = animales.filter(a => a.r === 'epico')
    else poolRareza = animales.filter(a => a.r === 'legendario')
    return poolRareza[Math.floor(Math.random() * poolRareza.length)]
}

export default {
    command: ['cazar', 'caza', 'hunt'],
    tag: 'juegos',
    categoria: 'juego',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: '🌸 Sal de expedición para cazar criaturas salvajes',

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
            return sock.sendMessage(from, { text: `> 🌸 Zona en alerta. Espera *${tiempoRestante}* para volver.` }, { quoted: msg })
        }

        cooldowns.set(selfNum, ahora)
        await sock.sendMessage(from, { react: { text: '🏹', key: msg.key } })

        if (Math.random() < 0.25) {
            return sock.sendMessage(from, { text: `> 🌲 *Expedición Fallida* ➜ Los animales huyeron de la zona.` }, { quoted: msg })
        }

        const cantidadAnimales = Math.floor(Math.random() * 4) + 1
        let totalKryonsGana = 0
        let totalXpGana = 0
        const listadoAnimales = []

        for (let i = 0; i < cantidadAnimales; i++) {
            const animal = obtenerAnimalPorProbabilidad()
            const variacionK = Math.floor(Math.random() * (25 - 5 + 1)) + 5
            totalKryonsGana += animal.k + variacionK
            totalXpGana += animal.x + Math.floor(variacionK / 4)
            listadoAnimales.push(animal.n)
        }

        addKryons(selfNum, totalKryonsGana)
        addXp(selfNum, totalXpGana)

        let txtExito = `> 🏹 *EXPEDICIÓN EXITOSA*\n`
        txtExito += `───────────────\n`
        txtExito += `> 🐾 *Presas:* ${listadoAnimales.join(', ')}\n`
        txtExito += `> 💎 *Botín:* +${totalKryonsGana} kryons | +${totalXpGana} XP`

        await sock.sendMessage(from, { text: txtExito }, { quoted: msg })
    }
}