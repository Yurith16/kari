// plugins/main-menu.js

export default {
  command: ["menu", "help", "comandos"],
  tag: "menu",
  categoria: "main",
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args, isOwner, isGroup, groupCfg, prefix }) {
    try {
      const { commands } = await import("../core/plugins.js");
      const pluginsArray = Array.from(commands.values());

      const botName = global.bot?.name || "Midori-Hana";
      await sock.sendMessage(from, { react: { text: "🌸", key: msg.key } });

      // Imagen fija del menú
      const imageUrl = "https://www.image2url.com/r2/default/images/1776639876334-87e327fb-c225-42d5-bf68-a594f976fb49.jpg";

      function toMono(text) {
        const map = {
          A: "𝙰", B: "𝙱", C: "𝙲", D: "𝙳", E: "𝙴", F: "𝙵", G: "𝙶", H: "𝙷",
          I: "𝙸", J: "𝙹", K: "𝙺", L: "𝙻", M: "𝙼", N: "𝙽", O: "𝙾", P: "𝙿",
          Q: "𝚀", R: "𝚁", S: "𝚂", T: "𝚃", U: "𝚄", V: "𝚅", W: "𝚆", X: "𝚇",
          Y: "𝚈", Z: "𝚉",
          a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎", f: "𝚏", g: "𝚐", h: "𝚑",
          i: "𝚒", j: "𝚓", k: "𝚔", l: "𝚕", m: "𝚖", n: "𝚗", o: "𝚘", p: "𝚙",
          q: "𝚚", r: "𝚛", s: "𝚜", t: "𝚝", u: "𝚞", v: "𝚟", w: "𝚠", x: "𝚡",
          y: "𝚢", z: "𝚣",
          0: "𝟶", 1: "𝟷", 2: "𝟸", 3: "𝟹", 4: "𝟺", 5: "𝟻", 6: "𝟼", 7: "𝟽",
          8: "𝟾", 9: "𝟿",
          ".": "․", " ": " ",
        };
        return text.split("").map((c) => map[c] || c).join("");
      }

      function toBold(text) {
        const map = {
          A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛",
          I: "𝗜", J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣",
          Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫",
          Y: "𝗬", Z: "𝗭",
          a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵",
          i: "𝗶", j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽",
          q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅",
          y: "𝘆", z: "𝘇",
          0: "𝟬", 1: "𝟭", 2: "𝟮", 3: "𝟯", 4: "𝟰", 5: "𝟱", 6: "𝟲", 7: "𝟳",
          8: "𝟴", 9: "𝟵",
          " ": " ",
        };
        return text.split("").map((c) => map[c] || c).join("");
      }

      // Categorías sin emojis en los títulos
      const categorias = {
        main:      "🌿 Principales",
        utilidad:  "🔧 Utilidad",
        diversion: "🎮 Diversión",
        admin:     "👑 Administración",
        owner:     "💎 Owner",
        nsfw:      "🔞 NSFW",
        descargas: "📥 Descargas",
        busqueda:  "🔍 Búsqueda",
      };

      // Filtrar comandos visibles (evitar duplicados por command name)
      const seen = new Set();
      const visibles = pluginsArray.filter((p) => {
        if (!p.command || !p.categoria) return false;
        if (p.owner && !isOwner) return false;
        if (p.group && !isGroup) return false;
        if (p.nsfw && (!groupCfg?.nsfw || !isGroup)) return false;

        // Evitar duplicados usando el primer comando como clave
        const cmdName = Array.isArray(p.command) ? p.command[0] : p.command;
        if (seen.has(cmdName)) return false;
        seen.add(cmdName);
        return true;
      });

      // Agrupar por categoría
      const mapa = {};
      visibles.forEach((p) => {
        const cat = p.categoria || "main";
        if (!mapa[cat]) mapa[cat] = [];
        const cmd = Array.isArray(p.command) ? p.command[0] : p.command;
        mapa[cat].push(cmd);
      });

      const div = `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`;

      let txt = `╭─〔 🌸 *${toMono(botName.toUpperCase())}* 🌸 〕\n`;
      txt += `│\n`;
      txt += `│ 👩‍💻 ${toBold("Desarrollador")}: ${global.bot?.owner || "Hernandez"}\n`;
      txt += `│ 📦 ${toBold("Versión")}: ${toMono(global.bot?.version || "3.0.0")}\n`;
      txt += `│ 💬 ${toBold("Prefijo")}: ${toMono(prefix)}\n`;
      txt += `│ ${div}\n`;

      for (const [key, nombre] of Object.entries(categorias)) {
        const cmds = mapa[key];
        if (!cmds || cmds.length === 0) continue;
        txt += `│ ${toBold(nombre)}\n`;

        cmds.forEach((cmd) => {
          txt += `│    🌱 ${toMono(prefix + cmd)}\n`;
        });
        txt += `│\n`;
      }

      txt += `╰─── *${toMono(botName)} ™* 🌸`;

      await sock.sendMessage(
        from,
        {
          image: { url: imageUrl },
          caption: txt,
        },
        { quoted: msg },
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        from,
        { text: "🍃 Error al mostrar el menú." },
        { quoted: msg },
      );
    }
  },
};