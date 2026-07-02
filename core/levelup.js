// core/levelup.js
import { checkLevelUp, getUser, getEconomy, addKryons } from './sqlite.js'
import { getRango }          from '../settings/rangos.js'
import { RECOMPENSAS_RANGO } from '../settings/economia.js'

export async function verificarSubida(sock, from, userNum) {
  const ecoAntes = getEconomy(userNum)
  if (!ecoAntes) return

  const rangoAnterior = getRango(ecoAntes.nivel)
  const nivelNuevo    = checkLevelUp(userNum)
  if (!nivelNuevo) return

  const rangoNuevo = getRango(nivelNuevo)
  const nombre     = getUser(userNum)?.nombre || userNum

  // ── Aviso de nivel ────────────────────────────────────────────────────────
  const msgNivel = (global.messages?.levelUp || '🌸 *{nombre}* subió al nivel *{nivel}*.')
    .replace('{nombre}', nombre)
    .replace('{nivel}', nivelNuevo)

  await sock.sendMessage(from, { text: msgNivel }).catch(() => {})

  // ── Aviso de rango si cambió ──────────────────────────────────────────────
  if (rangoNuevo.nombre !== rangoAnterior.nombre) {
    const recompensa = RECOMPENSAS_RANGO[rangoNuevo.desde] || 0
    if (recompensa > 0) addKryons(userNum, recompensa)

    const msgRango = (global.messages?.rankUp || '🌸 *{nombre}* llegó al rango *{rango}*. Aquí van *{recompensa}* kryons.')
      .replace('{nombre}', nombre)
      .replace('{rango}', `${rangoNuevo.emoji} ${rangoNuevo.nombre}`)
      .replace('{recompensa}', recompensa.toLocaleString())

    await sock.sendMessage(from, { text: msgRango }).catch(() => {})
  }
}