const messages = {
  // Sistema
  online:       '🌸 ¡Desperté! Midori-Hana está activa y con energías.',
  offline:      '🍂 Uy, me caí... Midori-Hana se desconectó sin avisar.',
  reconnecting: '🔄 Dame un segundito, ya vuelvo...',
  maintenance:  '🔧 Estoy en el spa, un retoquito y regreso pronto.',
  error:        '⚠️ Ay no, me dio un patatús... ¿me ayudas intentando de nuevo?',

  // Accesos
  ownerOnly:    '💎 Eso solo lo hace mi creador, lo siento corazón.',
  groupOnly:    '👥 Esta solo funciona en grupos, ábreme en uno y lo intentamos.',
  privateOnly:  '🔒 Solo atiendo comandos en el grupo oficial.\n{grupoOficial}',
  adminOnly:    '👮 Los admins están a cargo ahora, solo ellos pueden usar comandos.',
  nsfwDisabled: '🔞 Ay no, esas cositas no están permitidas en este grupo.',
  notAdmin:     '👮 Solo los admins pueden hacer eso, tú sigue participando.',
  botNotAdmin:  '⚠️ Necesito que me des admin para poder hacer eso, ¿sí?',

  // Protecciones
  antiLink:     '🔗 Ay no, aquí no se permiten enlaces, lo siento.',
  spamWarn:     '🌸 ¡Qué rápida eres! Espera {secs}s y lo intentamos otra vez.',
  mutedUser:    '🔇 Shhh... estás en modo silencio en este grupo.',

  // Owner — control
  botOff:         '🍂 Me voy a dormir, hasta prontito.',
  botRestart:     '🔄 Un respiro y vuelvo, no me extrañen.',
  maintenanceOn:  '🔧 Entrando al taller, solo mi creador puede hablarme.',
  maintenanceOff: '🌿 ¡Salí del taller! Todo vuelve a la normalidad.',
  broadcastSent:  '📢 ¡Mensajito enviado a {count} grupos!',
  broadcastFail:  '⚠️ Ay, a algunos grupos no les llegó el mensaje.',
  broadcastEmpty: '📢 Cuéntame qué quieres transmitir, no leo mentes.',
  banSuccess:     '🚫 Fuera del mundo Midori. Baneado con amor.',
  banAlready:     '⚠️ Esa personita ya estaba baneada.',
  unbanSuccess:   '✅ Le dimos otra oportunidad, desbaneado.',
  unbanNotFound:  '⚠️ Esa persona no estaba baneada, está libre.',
  bannedWarn:     '🚫 Tú no puedes usar el bot, lo siento.',
  leftGroup:      '🍃 Me fui del grupo, no era mi lugar.',
  prefixChanged:  '✅ Ahora me llamas con *{prefix}*, anotado.',
  ownerChanged:   '✅ Mi creador cambió, nueva jefatura.',
  imageChanged:   '✅ Foto de perfil renovada, ¡qué bonita!',
  backupDone:     '💾 Guardadito todo, backup listo.',
  restoreDone:    '✅ Todo en orden, base de datos recuperada.',
  restoreFail:    '⚠️ Algo falló al restaurar, revisa el archivo.',

  // Admin — moderación
  banGroupSuccess:   '🚫 Expulsadito del grupo, que le vaya bonito.',
  banGroupFail:      '⚠️ No pude sacarlo, ¿me diste admin?',
  unbanGroupSuccess: '✅ Puede volver, le dimos otra chance.',
  muteSuccess:       '🔇 Silenciadito, que descanse su voz.',
  unmuteSuccess:     '🔊 Ya puede hablar, se le acabó el castigo.',
  warnMsg:           '⚠️ Cuidadito @{user}, llevas {count}/3 avisos.',
  warnExpelled:      '🚫 @{user} juntó 3 avisos y se fue expulsadito.',
  warnReset:         '✅ Avisos de @{user} borrados, borrón y cuenta nueva.',
  deleteSuccess:     '🗑 Mensaje eliminado, como si nunca hubiera existido.',
  deleteFail:        '⚠️ No pude borrarlo, ese mensaje se resiste.',
  replyNeeded:       '↩️ Responde al mensaje que quieres usar, ando perdida.',
  userNeeded:        '↩️ Responde al mensaje de alguien o menciona su número.',

  // Admin — grupo
  groupNameChanged:  '✅ Nuevo nombrecito para el grupo, ¡me gusta!',
  groupDescChanged:  '✅ Descripción actualizada, quedó linda.',
  groupPhotoChanged: '✅ Foto del grupo cambiada, ¡qué bonita!',
  groupOpened:       '🔓 Grupo abierto, que entre quien quiera.',
  groupClosed:       '🔒 Grupo cerradito, solo admins mandan mensaje.',
  inviteGenerated:   '🔗 Enlace nuevo:\nhttps://chat.whatsapp.com/{code}',
  inviteConfirm:     '⚠️ El enlace anterior se va a romper. ¿Segura? Envía de nuevo.',
  welcomeOn:         '👋 Saludaré a los nuevos, bienvenidas activadas.',
  welcomeOff:        '👋 Dejé de saludar, bienvenidas desactivadas.',
  goodbyeOn:         '🍃 Me despediré de quien se vaya.',
  goodbyeOff:        '🍃 Ya no me despido, que se vayan en silencio.',
  adminModeOn:       '👮 Solo los admins mandan, grupo en orden.',
  adminModeOff:      '👮 Todos pueden hablar, grupos libres.',
  nsfwOn:            '🔞 Contenido +18 activado, con cuidado.',
  nsfwOff:           '🔞 Contenido +18 apagado, grupo sano.',
  antilinkOn:        '🔗 Enlaces prohibidos, el que mande link vuela.',
  antilinkOff:       '🔗 Pueden mandar enlaces, antilink apagado.',

  // Registro y perfil
  notRegistered:  '🌿 Ay, aún no te conozco. Usa *.registro* y me cuentas de ti.',
  alreadyRegistered: '🌸 Si ya eres de la familia. Usa *.perfil editar* si quieres cambiar algo.',
  registerSuccess: '✨ ¡Qué bonito nombre, {nombre}! Ya eres parte de Midori-Hana.',
  invalidAge:     '🌿 Esa edad no me cuadra, dime una entre 10 y 60 años.',
  invalidName:    '🌿 Ese nombre no me gusta, dime algo más lindo.',

  //busquedas y descargas

  // En messages.js, dentro del objeto:
busquedaEmpty: '🌸 ¿Qué quieres que busque? Dime y lo encuentro.',
busquedaNotFound: '🌱 No encontré nada, ¿seguro que está bien escrito?',
descargaError: '⚠️ No pude descargar eso, ¿está bien el enlace?',

  // Economía
  notEnoughKryons: '🍂 No te alcanza, corazón. Trabaja un poquito más.',
  bankEmpty:       '🍂 Tu banco está vacío, ¿qué vas a sacar?',
  cooldownMsg:     '🌸 Dame un respiro, espera {secs}s y vuelves.',
  stealFail:       '🌸 Te atraparon con las manos en la masa... sin kryons.',
  stealSuccess:    '✨ ¡Le robaste {amt} kryons a @{user} sin que te viera!',
  crimeSuccess:    '🌿 Tu plan salió perfecto. Ganaste {amt} kryons.',
  crimeFail:       '🍂 Salió mal... perdiste {amt} kryons, qué triste.',

  // ─── Economía / Registro ──────────────────────────────────────────────────
  ecoDisabled:    '🌿 Los comandos de economía están de vacaciones en este grupo.',
  noKryons:       '🍃 No tienes kryons suficientes para eso, qué pena.',
  registroYa:     '🌸 Ya tienes perfil, corazón. Usa *.perfil* para verte.',
  registroOk:     '🌿 ¡{nombre}, bienvenida a la familia Midori!',
  registroCanceled: '🍃 Cancelado. Cuando quieras volver, aquí estoy.',
  edadInvalida:   '🌸 Dime una edad real, entre 10 y 60 años.',
}

global.messages = messages
export default messages