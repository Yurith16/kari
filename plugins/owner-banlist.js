import { getBanned } from '../core/sqlite.js'

export default {
  command:   'baneados',
  tag:       'baneados',
  categoria: 'owner',
  owner:     true,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const lista = getBanned()
    if (lista.length === 0) {
      await sock.sendMessage(from, { text: '✅ No hay usuarios baneados.' }, { quoted: msg })
      return
    }
    const txt = lista.map((n, i) => `${i + 1}. +${n}`).join('\n')
    await sock.sendMessage(from, { text: `🚫 *Usuarios baneados:*\n\n${txt}` }, { quoted: msg })
  }
}