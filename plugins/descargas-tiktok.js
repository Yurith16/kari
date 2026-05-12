import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DOWNLOAD_DIR = resolve('media/tiktok');
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true });

export default {
  command: ['tiktok', 'tt'],
  tag: 'tiktok',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de TikTok en calidad HD',

  async execute(sock, msg, { from, args }) {
    if (!args[0]) return sock.sendMessage(from, {
      text: `✦ *Ingresa la URL del video de TikTok que deseas descargar.*`
    }, { quoted: msg });

    const videoUrl = args[0];
    let localFilePath = null;

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

      const Q = encodeURIComponent(videoUrl);
      const res = execSync(`curl -s --max-time 20 'https://www.tikwm.com/api/' \
        -X POST \
        -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: https://www.tikwm.com' \
        -H 'Referer: https://www.tikwm.com/es/' \
        --data-raw 'url=${Q}&count=12&cursor=0&web=1&hd=1'`, { encoding: 'utf-8' });

      const json = JSON.parse(res);
      if (json.code !== 0 || !json.data) throw new Error('Error API');

      const descripcion = json.data.title || '';
      const finalUrl = json.data.hdplay ? `https://www.tikwm.com${json.data.hdplay}` : `https://www.tikwm.com${json.data.play}`;

      const fileName = `tiktok_${Date.now()}.mp4`;
      localFilePath = join(DOWNLOAD_DIR, fileName);

      execSync(`ffmpeg -y -loglevel error -user_agent "Mozilla/5.0" -i "${finalUrl}" -c copy "${localFilePath}"`, { stdio: 'inherit' });

      const stats = statSync(localFilePath);
      const caption = descripcion ? `📝 *${descripcion}*` : '';

      await sock.sendMessage(from, stats.size > 80*1024*1024 
        ? { document: { url: localFilePath }, mimetype: 'video/mp4', fileName, caption }
        : { video: { url: localFilePath }, caption },
        { quoted: msg });

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (e) {
      console.error('Error TikTok:', e.message);
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
      if (localFilePath && existsSync(localFilePath)) try { unlinkSync(localFilePath); } catch {}
    }
  }
};