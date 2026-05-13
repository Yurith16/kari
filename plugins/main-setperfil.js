// plugins/editarperfil.js

import { getUser, setUserField, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

export default {
  command:     'setperfil',
  tag:         'setperfil',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Edita tu perfil (frase, color, animal, apodo)',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (respuesta.toLowerCase() === 'cancelar') {
      sesiones.delete(userNum)
      await sock.sendMessage(from, { text: '🌸 Edición cancelada. Tu perfil sigue como estaba.' }, { quoted: msg })
      return
    }

    const { paso } = sesion

    // Paso 0: Elegir qué editar
    if (paso === 0) {
      if (respuesta === '1') {
        sesion.paso = 1
        await sock.sendMessage(from, {
          text: `💬 ¿Qué frase quieres poner en tu perfil?\n\n_Escribe \"cancelar\" para salir._`
        }, { quoted: msg })
        return
      }
      if (respuesta === '2') {
        sesion.paso = 2
        await sock.sendMessage(from, {
          text: `🎨 ¿Cuál es tu color favorito?\n\n_Escribe \"cancelar\" para salir._`
        }, { quoted: msg })
        return
      }
      if (respuesta === '3') {
        sesion.paso = 3
        await sock.sendMessage(from, {
          text: `🐾 ¿Cuál es tu animal favorito?\n\n_Escribe \"cancelar\" para salir._`
        }, { quoted: msg })
        return
      }
      if (respuesta === '4') {
        sesion.paso = 4
        await sock.sendMessage(from, {
          text: `🌸 ¿Qué apodo quieres tener?\n\n_Escribe \"cancelar\" para salir._`
        }, { quoted: msg })
        return
      }
      if (respuesta === '5') {
        sesiones.delete(userNum)
        await sock.sendMessage(from, { text: '🌸 Edición cancelada.' }, { quoted: msg })
        return
      }
      // Si no es un número válido, ignorar
      return
    }

    // Paso 1: Frase
    if (paso === 1) {
      if (respuesta.length > 100) {
        await sock.sendMessage(from, {
          text: '🌸 La frase es muy larga, máximo 100 caracteres. Intenta con algo más corto.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'frase', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `💬 Frase actualizada:\n\n_\"${respuesta}\"_\n\n🌸 Tu perfil se ve más bonito ahora.`
      }, { quoted: msg })
      return
    }

    // Paso 2: Color favorito
    if (paso === 2) {
      if (respuesta.length > 30) {
        await sock.sendMessage(from, {
          text: '🌸 Ese color es muy largo, máximo 30 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'color', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🎨 Color favorito actualizado: *${respuesta}*\n\n🌸 Qué bonito color.`
      }, { quoted: msg })
      return
    }

    // Paso 3: Animal favorito
    if (paso === 3) {
      if (respuesta.length > 30) {
        await sock.sendMessage(from, {
          text: '🌸 Ese nombre es muy largo, máximo 30 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'animal', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🐾 Animal favorito actualizado: *${respuesta}*\n\n🌸 Qué tierno.`
      }, { quoted: msg })
      return
    }

    // Paso 4: Apodo
    if (paso === 4) {
      if (respuesta.length > 25) {
        await sock.sendMessage(from, {
          text: '🌸 El apodo es muy largo, máximo 25 caracteres.'
        }, { quoted: msg })
        return
      }
      setUserField(userNum, 'apodo', respuesta)
      sesiones.delete(userNum)
      await sock.sendMessage(from, {
        text: `🌸 Apodo actualizado: *${respuesta}*\n\n¡Así te conocerán ahora!`
      }, { quoted: msg })
      return
    }
  },

  async execute(sock, msg, { from, sender }) {
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (sesiones.has(selfNum)) {
      await sock.sendMessage(from, {
        text: '🌸 Ya tienes una edición en proceso. Responde o escribe *cancelar*.'
      }, { quoted: msg })
      return
    }

    const perfil = getUser(selfNum)

    sesiones.set(selfNum, { paso: 0 })

    let txt = `🌸 *¿Qué quieres editar?*\n\n`
    txt += `*1.* Frase ${perfil.frase ? `(${perfil.frase.slice(0, 30)}...)` : ''}\n`
    txt += `*2.* Color favorito ${perfil.color ? `(${perfil.color})` : ''}\n`
    txt += `*3.* Animal favorito ${perfil.animal ? `(${perfil.animal})` : ''}\n`
    txt += `*4.* Apodo ${perfil.apodo ? `(${perfil.apodo})` : ''}\n`
    txt += `*5.* Cancelar\n\n`
    txt += `_Responde con el número o escribe \"cancelar\"._`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}