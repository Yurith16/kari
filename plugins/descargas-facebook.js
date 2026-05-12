import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DOWNLOAD_DIR = resolve('media/facebook');
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true });

export default {
  command: ['fb', 'facebook'],
  tag: 'facebook',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de Facebook en HD (o SD si es largo)',

  async execute(sock, msg, { from, args }) {
    if (!args[0]) return sock.sendMessage(from, {
      text: `✦ *Ingresa la URL del video de Facebook que deseas descargar.*`
    }, { quoted: msg });

    const videoUrl = args[0];
    let localFilePath = null;

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

      const params = new URLSearchParams({ url: videoUrl, ajax: '1', lang: 'en' });
      const res = execSync(`curl -s --max-time 25 'https://kfvid.com/mates/en/analyze/ajax?retry=undefined&platform=facebook&mhash=ca44ba3bf448c126' \
        -X POST \
        -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: https://kfvid.com' \
        -H 'Referer: https://kfvid.com/' \
        --data-raw '${params.toString()}'`, { encoding: 'utf-8' });

      const json = JSON.parse(res);
      if (json.status !== 'success') throw new Error('Error API');

      const durMatch = json.result.match(/<p>(\d{2}):(\d{2}):(\d{2})<\/p>/);
      let duracionMin = 0;
      if (durMatch) {
        duracionMin = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]);
      }

      let match;
      if (duracionMin > 60) {
        match = json.result.match(/href='(https:\/\/video-[^']*?tag=sve_sd[^']*?)'/);
        if (!match) match = json.result.match(/href='(https:\/\/video-[^']*?tag=[^']*?)'/);
      } else {
        match = json.result.match(/720p[^<]*<a[^>]*href='(https:\/\/video-[^']*?)'/);
        if (!match) match = json.result.match(/href='(https:\/\/video-[^']*?tag=sve_sd[^']*?)'/);
        if (!match) match = json.result.match(/href='(https:\/\/video-[^']*?tag=[^']*?)'/);
      }
      if (!match) throw new Error('No se encontró enlace');

      const finalUrl = match[1].replace(/&amp;/g, '&');
      const fileName = `fb_${Date.now()}.mp4`;
      localFilePath = join(DOWNLOAD_DIR, fileName);

      execSync(`ffmpeg -y -loglevel error -user_agent "Mozilla/5.0" -headers "Referer: https://kfvid.com/" -i "${finalUrl}" -c copy "${localFilePath}"`, { stdio: 'inherit' });

      if (!existsSync(localFilePath)) throw new Error('No se pudo descargar');

      const stats = statSync(localFilePath);

      if (stats.size > 80 * 1024 * 1024) {
        await sock.sendMessage(from, { document: { url: localFilePath }, mimetype: 'video/mp4', fileName }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { video: { url: localFilePath } }, { quoted: msg });
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (e) {
      console.error('Error Facebook:', e.message);
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
      if (localFilePath && existsSync(localFilePath)) try { unlinkSync(localFilePath); } catch {}
    }
  }
};