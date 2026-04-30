// Confirma antes de revocar el enlace actual
const pendingConfirm = new Map()

export default {
  command:   'revoke',
  tag:       'revoke (reset link)',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, sender, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const key  = `${from}:${sender}`
    const now  = Date.now()

    if (pendingConfirm.has(key) && now - pendingConfirm.get(key) < 30_000) {
      pendingConfirm.delete(key)
      try {
        const code = await sock.groupRevokeInvite(from)
        await sock.sendMessage(from, {
          text: global.messages.inviteGenerated.replace('{code}', code)
        }, { quoted: msg })
      } catch {
        await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
      }
    } else {
      pendingConfirm.set(key, now)
      await sock.sendMessage(from, { text: global.messages.inviteConfirm }, { quoted: msg })
    }
  }
}