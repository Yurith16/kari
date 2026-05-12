import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

console.log('🎬 YOUTUBE MP3 DOWNLOADER');
const VIDEO_URL = (await ask('URL del video: ')).trim();
rl.close();

const params = new URLSearchParams({ url: VIDEO_URL, ajax: '1', lang: 'en' });

const res = execSync(`curl -s --max-time 25 'https://kfvid.com/mates/en/analyze/ajax?retry=undefined&platform=youtube&mhash=1ed739acd9b3168b' \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Origin: https://kfvid.com' \
  -H 'Referer: https://kfvid.com/youtube-video-downloader' \
  --data-raw '${params.toString()}'`, { encoding: 'utf-8' });

const json = JSON.parse(res);
if (json.status !== 'success' || !json.result.includes('Audio')) throw new Error('Error API');

const allUrls = [...json.result.matchAll(/data-url='(https:\/\/[^']*?)'/g)];
let match = allUrls.find(m => m[1].includes('itag=251')) || allUrls.find(m => m[1].includes('itag=140'));
if (!match) throw new Error('No se encontró audio');

const finalUrl = match[1].replace(/&amp;/g, '&');
const ext = finalUrl.includes('mime=audio%2Fmp4') || match[1].includes('itag=140') ? '.mp3' : '.opus';

if (!existsSync('./descargas')) mkdirSync('./descargas');
const out = `./descargas/yt_audio${ext}`;
console.log('Descargando...');
execSync(`ffmpeg -y -loglevel error -user_agent "Mozilla/5.0" -i "${finalUrl}" -c copy "${out}"`, { stdio: 'inherit' });
console.log('✅', out);