import { setGroupField } from '../core/sqlite.js'

export default {
  command:     'welcome',
  tag:         'welcome',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Activa/Desactiva y configura la bienvenida del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin, groupCfg }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const args = fullText.split(' ').slice(1)

    // ─── Configurar por URL ───────────────────────────────────────────────────
    if (args.length && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(args[0])) {
      setGroupField(from, 'welcomeImg', args[0])
      await sock.sendMessage(from, {
        text: '👋 Imagen de bienvenida actualizada con esa URL. ¡Qué bonita!'
      }, { quoted: msg })
      return
    }

    // ─── Configurar texto ─────────────────────────────────────────────────────
    const texto = args.join(' ')
    if (texto) {
      setGroupField(from, 'welcomeText', texto)
      await sock.sendMessage(from, {
        text: `👋 Mensaje de bienvenida actualizado:\n\n${texto}`
      }, { quoted: msg })
      return
    }

    // ─── Toggle on/off ────────────────────────────────────────────────────────
    const estado = groupCfg?.welcomeMsg
    setGroupField(from, 'welcomeMsg', estado ? 0 : 1)
    await sock.sendMessage(from, {
      text: estado ? global.messages.welcomeOff : global.messages.welcomeOn
    }, { quoted: msg })
  }
}