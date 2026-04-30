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
  notAdmin:     '👮 No tienes permisos de administrador para usar este comando.',
  botNotAdmin:  '⚠️ Necesito ser administrador del grupo para hacer eso.',

  // Protecciones
  antiLink:     '🔗 Los enlaces no están permitidos en este grupo.',
  spamWarn:     '⏳ Vas muy rápido, espera {secs}s antes de continuar.',
  mutedUser:    '🔇 Tu cuenta está silenciada en este grupo.',

  // Owner — control
  botOff:         '🍂 Apagando el sistema, hasta pronto.',
  botRestart:     '🔄 Reiniciando el sistema, vuelvo en un momento.',
  maintenanceOn:  '🔧 Modo mantenimiento activado. Solo el owner puede operar.',
  maintenanceOff: '🌿 Modo mantenimiento desactivado. Todo vuelve a la normalidad.',
  broadcastSent:  '📢 Mensaje enviado a {count} grupos.',
  broadcastFail:  '⚠️ No se pudo enviar a algunos grupos.',
  broadcastEmpty: '📢 Escribe el mensaje que quieres transmitir.',
  banSuccess:     '🚫 Usuario baneado globalmente.',
  banAlready:     '⚠️ Ese usuario ya está baneado.',
  unbanSuccess:   '✅ Usuario desbaneado.',
  unbanNotFound:  '⚠️ Ese usuario no estaba baneado.',
  bannedWarn:     '🚫 Tu acceso al bot está restringido.',
  leftGroup:      '🍃 Salí del grupo.',
  prefixChanged:  '✅ Prefijo actualizado a *{prefix}*.',
  ownerChanged:   '✅ Número de owner actualizado.',
  imageChanged:   '✅ Imagen por defecto actualizada.',
  backupDone:     '💾 Backup generado correctamente.',
  restoreDone:    '✅ Base de datos restaurada.',
  restoreFail:    '⚠️ No se pudo restaurar, verifica el archivo.',

  // Admin — moderación
  banGroupSuccess:   '🚫 Usuario expulsado del grupo.',
  banGroupFail:      '⚠️ No pude expulsar al usuario, verifica mis permisos.',
  unbanGroupSuccess: '✅ Usuario desbloqueado del grupo.',
  muteSuccess:       '🔇 Usuario silenciado. Sus mensajes serán eliminados.',
  unmuteSuccess:     '🔊 Usuario desilenciado.',
  warnMsg:           '⚠️ Advertencia {count}/3 para @{user}. Cuida tu comportamiento.',
  warnExpelled:      '🚫 @{user} acumuló 3 advertencias y fue expulsado.',
  warnReset:         '✅ Advertencias de @{user} reiniciadas.',
  deleteSuccess:     '🗑 Mensaje eliminado.',
  deleteFail:        '⚠️ No pude eliminar ese mensaje.',
  replyNeeded:       '↩️ Responde al mensaje que quieres usar con este comando.',
  userNeeded:        '↩️ Responde al mensaje del usuario o menciona su número.',

  // Admin — grupo
  groupNameChanged:  '✅ Nombre del grupo actualizado.',
  groupDescChanged:  '✅ Descripción actualizada.',
  groupPhotoChanged: '✅ Foto del grupo actualizada.',
  groupOpened:       '🔓 El grupo está abierto, todos pueden enviar mensajes.',
  groupClosed:       '🔒 El grupo está cerrado, solo admins pueden enviar mensajes.',
  inviteGenerated:   '🔗 Nuevo enlace generado:\nhttps://chat.whatsapp.com/{code}',
  inviteConfirm:     '⚠️ Esto revocará el enlace actual. Envía el comando de nuevo para confirmar.',
  welcomeOn:         '👋 Mensaje de bienvenida activado en este grupo.',
  welcomeOff:        '👋 Mensaje de bienvenida desactivado.',
  goodbyeOn:         '🍃 Mensaje de despedida activado en este grupo.',
  goodbyeOff:        '🍃 Mensaje de despedida desactivado.',
  adminModeOn:       '👮 Modo admin activado. Solo administradores pueden usar comandos.',
  adminModeOff:      '👮 Modo admin desactivado. Todos pueden usar comandos.',
  nsfwOn:            '🔞 Contenido NSFW habilitado en este grupo.',
  nsfwOff:           '🔞 Contenido NSFW deshabilitado.',
  antilinkOn:        '🔗 Antilink activado. Los enlaces serán eliminados.',
  antilinkOff:       '🔗 Antilink desactivado.',
}

global.messages = messages
export default messages