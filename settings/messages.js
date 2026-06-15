const messages = {
  // Sistema
  online:       '🌸 Midori despertó. Estiró las hojitas y ya está lista para acompañarte.',
  offline:      '🍂 Midori se fue a dormir. Que descanses, mañana nos vemos.',
  reconnecting: '🌿 Un momento, me estoy acomodando... ya casi estoy.',
  maintenance:  '🌸 Estoy en el taller un ratito. Vuelvo más bonita.',
  error:        '🌸 Ay, algo salió mal. ¿Lo intentamos de nuevo?',

  // Accesos
  ownerOnly:    '🌸 Eso solo puede hacerlo mi creador, tú entiendes.',
  groupOnly:    '🌸 Este comando es para usarlo en grupo, allá nos vemos.',
  privateOnly:  '🌸 Mejor háblame en privado, es más íntimo.',
  adminOnly:    '🌸 Solo los administradores tienen ese poder.',
  nsfwDisabled: '🌸 Ese contenido está apagado en este grupo.',
  notAdmin:     '🌸 Necesitas ser administrador para eso, bonito.',
  botNotAdmin:  '🌸 Dame admin y verás lo que puedo hacer.',

  // Protecciones
  antiLink:     '🌸 Aquí no se permiten enlaces, cuidemos el jardín.',
  spamWarn:     '🌸 Tranquilo, espera {secs}s y lo intentamos otra vez.',
  mutedUser:    '🌸 Estás en silencio, descansa la voz un rato.',

  // Owner
  botOff:         '🍂 Me voy a dormir. Gracias por todo hoy.',
  botRestart:     '🌿 Un respiro y vuelvo, no me extrañes.',
  maintenanceOn:  '🌸 Modo mantenimiento, solo mi creador puede verme.',
  maintenanceOff: '🌿 Ya volví, estoy lista para seguir.',
  broadcastSent:  '🌸 Mensaje enviado a {count} grupos, llegó a todos lados.',
  broadcastFail:  '🍂 A algunos grupos no les llegó, lo siento.',
  broadcastEmpty: '🌸 ¿Qué quieres transmitir? Cuéntame.',
  banSuccess:     '🌸 Baneado, ya no puede entrar al jardín.',
  banAlready:     '🌸 Esa persona ya estaba baneada.',
  unbanSuccess:   '🌸 Le dimos otra oportunidad, bienvenida de vuelta.',
  unbanNotFound:  '🌸 Esa persona no estaba baneada.',
  bannedWarn:     '🌸 No puedes usar el bot, estás fuera del jardín.',
  leftGroup:      '🍃 Me fui del grupo. Cuidense mucho.',
  prefixChanged:  '🌸 Ahora me llamas con {prefix}, anotado.',
  ownerChanged:   '🌸 Creador actualizado, nueva jefatura.',
  imageChanged:   '🌸 Foto de perfil actualizada, quedó bonita.',
  backupDone:     '🌸 Backup guardado, todo a salvo.',
  restoreDone:    '🌸 Base de datos restaurada, todo en orden.',
  restoreFail:    '🍂 Falló la restauración, revisa el archivo.',

  // Admin
  banGroupSuccess:   '🌸 Expulsado del grupo, que le vaya bonito.',
  banGroupFail:      '🌸 No pude expulsarlo, ¿me diste admin?',
  unbanGroupSuccess: '🌸 Puede volver, el grupo lo extraña.',
  muteSuccess:       '🌸 Silenciado, que descanse su voz.',
  unmuteSuccess:     '🌸 Ya puede hablar, se acabó el silencio.',
  warnMsg:           '🌸 @{user} llevas {count}/3 avisos, con cuidado.',
  warnExpelled:      '🌸 @{user} llegó a 3 avisos, el jardín lo expulsó.',
  warnReset:         '🌸 Avisos de @{user} reiniciados, borrón y cuenta nueva.',
  deleteSuccess:     '🌸 Mensaje eliminado, como si nunca hubiera pasado.',
  deleteFail:        '🍂 No pude borrar ese mensaje.',
  replyNeeded:       '🌸 Responde al mensaje que quieres usar.',
  userNeeded:        '🌸 Menciona a alguien o responde su mensaje.',

  // Grupo
  groupNameChanged:  '🌸 Nombre del grupo actualizado, así me gusta más.',
  groupDescChanged:  '🌸 Descripción actualizada.',
  groupPhotoChanged: '🌸 Foto del grupo cambiada, quedó linda.',
  groupOpened:       '🌸 Grupo abierto, que entre quien quiera.',
  groupClosed:       '🌸 Grupo cerrado, solo admin pueden hablar.',
  inviteGenerated:   '🌸 Enlace nuevo: https://chat.whatsapp.com/{code}',
  inviteConfirm:     '🌸 El enlace anterior se romperá, confirma de nuevo.',
  welcomeOn:         '🌸 Bienvenidas activadas, saludaré a los nuevos.',
  welcomeOff:        '🍃 Bienvenidas desactivadas.',
  goodbyeOn:         '🍃 Despedidas activadas, me despediré con cariño.',
  goodbyeOff:        '🌸 Despedidas desactivadas.',
  adminModeOn:       '🌸 Modo admin activado.',
  adminModeOff:      '🌸 Modo admin desactivado, todos pueden jugar.',
  nsfwOn:            '🌸 Contenido +18 activado, con responsabilidad.',
  nsfwOff:           '🌸 Contenido +18 desactivado.',
  antilinkOn:        '🌸 Antilink activado, cuidemos el jardín.',
  antilinkOff:       '🌸 Antilink desactivado, pueden compartir.',

  // Registro
  notRegistered:     '🌸 Todavía no te conozco. Usa *.reg* y me cuentas de ti.',
  alreadyRegistered: '🌸 Ya tienes perfil. Usa *.perfil* para verte.',
  registerSuccess:   '🌸 Bienvenida, {nombre}. Ya eres parte del jardín de Midori.',
  invalidAge:        '🌸 Esa edad no me cuadra, entre 10 y 60 años.',
  invalidName:       '🌸 Ese nombre no me convence, elige otro más bonito.',
  registroYa:        '🌸 Ya tienes perfil. Usa *.perfil* para verte.',
  registroOk:        '🌸 {nombre}, bienvenida al jardín. Te estaba esperando.',
  registroCanceled:  '🍃 Registro cancelado. Cuando quieras, aquí estaré.',
  edadInvalida:      '🌸 Pon una edad real, entre 10 y 60 años.',

  // Economía
  ecoDisabled:      '🌸 La economía está desactivada en este grupo.',
  notEnoughKryons:  '🍂 No te alcanzan los kryons, trabaja un poquito más.',
  bankEmpty:        '🍂 Tu banco está vacío, deposita algo primero.',
  cooldownMsg:      '🌸 Espera {secs}s antes de volver, un respiro.',
  noKryons:         '🍂 No tienes kryons suficientes para eso.',
  stealFail:        '🍂 Te atraparon con las manos en la masa.',
  stealSuccess:     '🌸 Le robaste {amt} kryons a @{user}, qué astuto.',

  // Búsquedas
  busquedaEmpty:    '🌸 ¿Qué quieres buscar? Dime y lo encuentro.',
  busquedaNotFound: '🍂 No encontré nada, lo siento.',
  descargaError:    '🌸 No pude descargar, ¿está bien el enlace?',
}

global.messages = messages
export default messages