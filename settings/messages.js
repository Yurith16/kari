const messages = {
  // Sistema
  online:       '🌿 Midori-Hana está activa y lista.',
  offline:      '🍂 Midori-Hana se desconectó inesperadamente.',
  reconnecting: '🔄 Reconectando, un momento...',
  maintenance:  '🔧 Estoy en mantenimiento, vuelve pronto.',
  error:        '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.',

  // Accesos
  ownerOnly:    '🔒 Este comando es exclusivo del owner.',
  groupOnly:    '👥 Este comando solo funciona en grupos.',
  privateOnly:  '🔒 Los comandos solo están disponibles en el grupo oficial.\n{grupoOficial}',
  adminOnly:    '👮 Este grupo está en modo admin, solo administradores pueden usar comandos.',
  nsfwDisabled: '🔞 El contenido +18 no está habilitado en este grupo.',

  // Protecciones
  antiLink:     '🔗 Los enlaces no están permitidos en este grupo.',
  spamWarn:     '⏳ Vas muy rápido, espera {secs}s antes de continuar.',

  // Grupos
  mutedUser:    '🔇 Tu cuenta está silenciada en este grupo.',
}

global.messages = messages
export default messages