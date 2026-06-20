// settings/rangos.js

export const RANGOS = [
  { desde: 1,   hasta: 9,   nombre: 'Alma Errante',           emoji: '🌑' },
  { desde: 10,  hasta: 19,  nombre: 'Sombra Persistente',     emoji: '🌒' },
  { desde: 20,  hasta: 29,  nombre: 'Susurro Nocturno',       emoji: '🌓' },
  { desde: 30,  hasta: 39,  nombre: 'Caminante de la Niebla', emoji: '🌫️' },
  { desde: 40,  hasta: 49,  nombre: 'Custodio del Secreto',   emoji: '🔮' },
  { desde: 50,  hasta: 59,  nombre: 'Tejedor de Silencios',   emoji: '🕸️' },
  { desde: 60,  hasta: 69,  nombre: 'Guardián del Umbral',    emoji: '⚔️' },
  { desde: 70,  hasta: 79,  nombre: 'Oráculo Oculto',         emoji: '👁️' },
  { desde: 80,  hasta: 89,  nombre: 'Forjador de Sombras',    emoji: '🔥' },
  { desde: 90,  hasta: 99,  nombre: 'Arquitecto de Sueños',   emoji: '🏛️' },
  { desde: 100, hasta: 109, nombre: 'Vigilante del Abismo',   emoji: '🌊' },
  { desde: 110, hasta: 119, nombre: 'Señor del Reflejo',      emoji: '🪞' },
  { desde: 120, hasta: 129, nombre: 'Mensajero del Ocaso',    emoji: '🌅' },
  { desde: 130, hasta: 139, nombre: 'Juez de las Sombras',    emoji: '⚖️' },
  { desde: 140, hasta: 149, nombre: 'Soberano del Vacío',     emoji: '👑' },
  { desde: 150, hasta: Infinity, nombre: 'El Que Todo lo Sabe', emoji: '✨' },
]

// Obtener rango según nivel actual
export function getRango(nivel) {
  return RANGOS.find(r => nivel >= r.desde && nivel <= r.hasta) || RANGOS[0]
}

// XP acumulada necesaria para alcanzar un nivel
export function xpParaNivel(nivel) {
  if (nivel <= 1) return 0
  let total = 0
  for (let i = 1; i < nivel; i++) {
    total += Math.floor(400 * Math.pow(1.5, i - 1))
  }
  return total
}

// XP necesaria para subir del nivel actual al siguiente
export function xpParaSiguienteNivel(nivel) {
  return Math.floor(400 * Math.pow(1.5, nivel - 1))
}