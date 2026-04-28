import chalk from 'chalk'

// ─── Logger ──────────────────────────────────────────────────────────────────

const time = () => new Date().toLocaleTimeString('es', { hour12: false })

export const logger = {
  info:  (label, msg) => console.log(chalk.green(`[${time()}] ✦ ${label}`) + chalk.white(` ${msg}`)),
  warn:  (label, msg) => console.log(chalk.yellow(`[${time()}] ⚠ ${label}`) + chalk.white(` ${msg}`)),
  error: (label, err) => console.log(chalk.red(`[${time()}] ✖ ${label}`) + chalk.gray(` ${err?.message || err}`)),
  cmd:   (name, sender, group) => console.log(chalk.cyan(`[${time()}] ❯ .${name}`) + chalk.gray(` ${sender}${group ? ` en ${group}` : ''}`)),
  banner: () => {
    console.log(chalk.green(`
  ╔══════════════════════════════╗
  ║   🌿  ${global.bot?.name || 'Bot'}  v${global.bot?.version || '1.0.0'}       ║
  ╚══════════════════════════════╝`))
  }
}

// ─── Delay anti-baneo ────────────────────────────────────────────────────────

export const delay = (min = global.bot?.minDelay ?? 300, max = global.bot?.maxDelay ?? 900) =>
  new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min))

// ─── AutoBio ─────────────────────────────────────────────────────────────────

export function startAutoBio(sock) {
  if (!global.features?.autoBio) return
  const update = () => {
    const h = new Date().getHours()
    const estado = h >= 6 && h < 12 ? '🌅 Buenos días'
                 : h >= 12 && h < 18 ? '☀️ Buenas tardes'
                 : h >= 18 && h < 22 ? '🌙 Buenas noches'
                 : '🌌 En la madrugada'
    sock.updateProfileStatus(`${estado} | ${global.bot?.name}`).catch(() => {})
  }
  update()
  setInterval(update, 30 * 60 * 1000)
}