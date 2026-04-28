// plugins/ping.js — ejemplo de estructura de un comando

export default {
  command: 'ping',       // string o array: ['ping', 'p']
  tag: 'ping',           // nombre del comando para identificación
  categoria: 'main',     // categoría para organizar en el menú
  owner:   false,        // true = solo owner
  group:   false,        // true = solo en grupos
  nsfw:    false,        // true = requiere nsfw habilitado en el grupo

  async execute(sock, msg, { from, args, isOwner, isGroup, groupCfg, prefix }) {
    await sock.sendMessage(from, { text: '🌿 Pong!' }, { quoted: msg })
  }
}