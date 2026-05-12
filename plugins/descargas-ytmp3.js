import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DOWNLOAD_DIR = resolve('media/youtube');
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true });

export default {
  command: ['ytmp3', 'youtube'],
  tag: 'youtube',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio MP3 de YouTube (320k)',

  async execute(sock, msg, { from, args }) {
    if (!args[0]) return sock.sendMessage(from, {
      text: `✦ *Ingresa la URL del video de YouTube.*`
    }, { quoted: msg });

    const videoUrl = args[0];
    let localFilePath = null;

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

      // Paso 1: Obtener datos del video
      const params = new URLSearchParams({ url: videoUrl, ajax: '1', lang: 'en' });
      const analyzeRes = execSync(`curl -s --max-time 25 'https://kfvid.com/mates/en/analyze/ajax?retry=undefined&platform=youtube&mhash=1ed739acd9b3168b' \
        -X POST \
        -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: https://kfvid.com' \
        -H 'Referer: https://kfvid.com/youtube-video-downloader' \
        --data-raw '${params.toString()}'`, { encoding: 'utf-8' });

      const json = JSON.parse(analyzeRes);
      if (json.status !== 'success') throw new Error('Error API');

      // Extraer ID y formato
      const idMatch = json.result.match(/data-fid='([^']+)'/);
      const videoId = idMatch ? idMatch[1] : '';

      // Buscar 320k primero
      let formatMatch = json.result.match(/320k.*?data-ffid='([^']+)'/);
      let note = '320k';
      if (!formatMatch) {
        formatMatch = json.result.match(/128k.*?data-ffid='([^']+)'/);
        note = '128k';
      }
      if (!formatMatch) throw new Error('No se encontró audio');

      const format = formatMatch[1];

      // Paso 2: Convertir para obtener URL proxy
      const convParams = new URLSearchParams({
        platform: 'youtube',
        url: videoUrl,
        title: 'youtube video #' + videoId,
        id: videoId,
        ext: 'mp3',
        note: note,
        format: format
      });

      const convRes = execSync(`curl -s --max-time 25 'https://kfvid.com/mates/en/convert?id=${videoId}' \
        -X POST \
        -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: https://kfvid.com' \
        -H 'Referer: https://kfvid.com/youtube-video-downloader' \
        --data-raw '${convParams.toString()}'`, { encoding: 'utf-8' });

      const convJson = JSON.parse(convRes);
      if (convJson.status !== 'success' || !convJson.downloadUrlX) throw new Error('Error al convertir');

      const finalUrl = `https://px30.genyoutube.online/mates/en/download?url=${convJson.downloadUrlX}`;
      const fileName = `yt_${Date.now()}.mp3`;
      localFilePath = join(DOWNLOAD_DIR, fileName);

      execSync(`ffmpeg -y -loglevel error -user_agent "Mozilla/5.0" -headers "Referer: https://kfvid.com/" -i "${finalUrl}" -c copy "${localFilePath}"`, { stdio: 'inherit' });

      if (!existsSync(localFilePath)) throw new Error('No se pudo descargar');

      await sock.sendMessage(from, { audio: { url: localFilePath }, mimetype: 'audio/mpeg' }, { quoted: msg });
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (e) {
      console.error('Error YouTube:', e.message);
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
      if (localFilePath && existsSync(localFilePath)) try { unlinkSync(localFilePath); } catch {}
    }
  }
};