import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import ytSearch from "yt-search";
import axios from "axios";

const MUSIC_DIR = path.join("media", "music");

async function getApiKey() {
  const res = await axios.get("https://cnv.cx/v2/sanity/key", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
      Accept: "*/*",
      Referer: "https://iframe.y2meta-uk.com/",
      Origin: "https://iframe.y2meta-uk.com",
    },
    timeout: 15000,
  });
  return res.data.key;
}

export default {
  command: ["playdoc"],
  tag: "playdoc",
  categoria: "descargas",
  descripcion: "Descarga MP3 como documento",
  owner: false,
  group: false,

  async execute(sock, msg, { from, args }) {
    const query = Array.isArray(args)
      ? args.join(" ").trim()
      : String(args?.[0] || "").trim();

    if (!query) {
      return sock.sendMessage(
        from,
        {
          text: "✦ Ingresa el nombre o URL de YouTube.\n\nEjemplo: *.playdoc j balvin gris*",
        },
        { quoted: msg },
      );
    }

    console.log(`[PLAYDOC] Buscando "${query}"...`);
    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    try {
      fs.mkdirSync(MUSIC_DIR, { recursive: true });

      const API_KEY = await getApiKey();
      let videoId, title, thumbnail;

      const search = await ytSearch(query);
      if (!search.videos?.length) {
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(
          from,
          { text: "✦ No se encontraron resultados." },
          { quoted: msg },
        );
      }

      videoId = search.videos[0].videoId;
      title = search.videos[0].title;
      thumbnail = search.videos[0].thumbnail;

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption: `🎵 *${title}*\n⏳ Convirtiendo a MP3...`,
        },
        { quoted: msg },
      );

      const params = new URLSearchParams({
        link: `https://youtu.be/${videoId}`,
        format: "mp3",
        audioBitrate: "320",
        videoQuality: "720",
        filenameStyle: "pretty",
        vCodec: "h264",
      });

      const convRes = await axios.post(
        "https://cnv.cx/v2/converter",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            key: API_KEY,
            "User-Agent":
              "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
            Origin: "https://iframe.y2meta-uk.com",
            Referer: "https://iframe.y2meta-uk.com/",
          },
          timeout: 30000,
        },
      );

      if (convRes.data?.status !== "tunnel" || !convRes.data?.url) {
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(
          from,
          { text: "✦ No se pudo obtener el enlace de descarga." },
          { quoted: msg },
        );
      }

      console.log(`[PLAYDOC] Convirtiendo a MP3: ${title}`);
      await sock.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

      const filename = `${title.replace(/[^a-z0-9\-\.\s]/gi, "_")}.mp3`;
      const outputFile = path.join(MUSIC_DIR, filename);

      execSync(
        `ffmpeg -i "${convRes.data.url}" -codec:a libmp3lame -q:a 2 "${outputFile}" -y`,
        {
          stdio: "pipe",
          timeout: 120000,
        },
      );

      const buffer = fs.readFileSync(outputFile);
      const sizeMB = buffer.length / (1024 * 1024);
      console.log(`[PLAYDOC] ${sizeMB.toFixed(2)} MB`);

      await sock.sendMessage(from, { react: { text: "⬆️", key: msg.key } });

      await sock.sendMessage(
        from,
        {
          document: { url: outputFile },
          mimetype: "audio/mpeg",
          fileName: filename,
        },
        { quoted: msg },
      );

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

      setTimeout(() => fs.unlinkSync(outputFile), 10000);
    } catch (err) {
      console.error(`[PLAYDOC] Error: ${err.message}`);
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(
        from,
        { text: global.messages?.error || "✦ Error al descargar." },
        { quoted: msg },
      );
    }
  },
};
