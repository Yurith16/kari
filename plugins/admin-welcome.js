import { setGroupField } from '../core/sqlite.js'

export default {
  command:   'welcome',
  tag:       'welcome',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg, prefix }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    // Extraer texto completo conservando saltos de línea
    const fullText = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text || ''
    )

    // Quitar el comando del inicio y conservar todo lo demás con saltos
    const cmdLine  = fullText.split('\n')[0]                    // primera línea con el comando
    const firstLine = cmdLine.replace(/^[^\s]+\s*/, '')         // quitar .welcome del inicio
    const resto     = fullText.split('\n').slice(1).join('\n')  // líneas siguientes
    const texto     = (firstLine + (resto ? '\n' + resto : '')).trim()

    if (texto) {
      setGroupField(from, 'welcomeText', texto)
      await sock.sendMessage(from, {
        text: `👋 Mensaje de bienvenida actualizado:\n\n${texto}`
      }, { quoted: msg })
      return
    }

    const estado = groupCfg?.welcomeMsg
    setGroupField(from, 'welcomeMsg', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.welcomeOff : global.messages.welcomeOn
    }, { quoted: msg })
  }
}