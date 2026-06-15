import { resetTodosLosPerfiles } from '../core/sqlite.js'

export default {
  command:     ['resetperfiles', 'resetprofiles'],
  tag:         'resetperfiles',
  categoria:   'owner',
  owner:       true,
  group:       false,
  nsfw:        false,
  descripcion: 'Reinicia perfiles y niveles de todos (sencible)',

  async execute(sock, msg, { from, args }) {
    if (args[0] !== 'confirmar') {
      await sock.sendMessage(from, {
        text: `⚠️ Esto reiniciará el *perfil y nivel* de *todos* los usuarios.\n\n` +
              `💰 Los kryons y banco se mantienen intactos.\n` +
              `🌿 Todos deberán usar *.registro* de nuevo.\n\n` +
              `_Escribe *.resetperfiles confirmar* para continuar._`
      }, { quoted: msg })
      return
    }

    resetTodosLosPerfiles()

    await sock.sendMessage(from, { react: { text: '🍃', key: msg.key } })
    await sock.sendMessage(from, {
      text: `🍃 Perfiles y niveles reiniciados globalmente.\n\n💰 Kryons y banco conservados para todos.`
    }, { quoted: msg })
  }
}