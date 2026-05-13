import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

console.log('🎬 YOUTUBE MP3 DOWNLOADER');
const VIDEO_URL = (await ask('URL del video: ')).trim();
rl.close();

const params = new URLSearchParams({ url: VIDEO_URL, ajax: '1', lang: 'en' });
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

const has320 = json.result.includes("'320k','251'");
const format = has320 ? '251' : '140';
const note = has320 ? '320k' : '128k';

const idMatch = json.result.match(/'mp3','([^']+)'/);
if (!idMatch) throw new Error('No se encontró hash ID');
const hashId = idMatch[1];

const convRes = execSync(`curl -s --max-time 25 'https://kfvid.com/mates/en/convert?id=${hashId}' \
  -X POST \
  -H 'User-Agent: Mozilla/5.0' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Origin: https://kfvid.com' \
  -H 'Referer: https://kfvid.com/youtube-video-downloader' \
  --data-raw 'platform=youtube&url=${encodeURIComponent(VIDEO_URL)}&title=youtube+video&id=${hashId}&ext=mp3&note=${note}&format=${format}'`, { encoding: 'utf-8' });

const convJson = JSON.parse(convRes);
if (convJson.status !== 'success' || !convJson.downloadUrlX) throw new Error('Error al convertir');

const finalUrl = `https://px30.genyoutube.online/mates/en/download?url=${convJson.downloadUrlX}`;

if (!existsSync('./descargas')) mkdirSync('./descargas');
const out = './descargas/yt_audio.mp3';
execSync(`curl -sL --max-time 60 -o "${out}" '${finalUrl}'`, { stdio: 'inherit' });
console.log('✅', out);