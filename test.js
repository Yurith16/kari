import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

// Envolver fetch para que maneje cookies automáticamente
const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);

async function getInitialData(videoUrl) {
  const url = `https://savehub.cc/d/?url=${encodeURIComponent(videoUrl)}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
    'Referer': 'https://savehub.cc/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };

  const response = await fetchWithCookies(url, { headers });
  if (!response.ok) {
    throw new Error(`Error en petición inicial: ${response.status}`);
  }
  const text = await response.text();

  // Extraer token_validto y token_id del HTML o del script si están embebidos
  // Aquí tienes que adaptar según cómo vienen en la página. Ejemplo con regex:
  const tokenValidtoMatch = text.match(/token_validto\s*=\s*(\d+)/);
  const tokenIdMatch = text.match(/token_id\s*=\s*['"]([^'"]+)['"]/);

  if (!tokenValidtoMatch || !tokenIdMatch) {
    throw new Error('No se pudieron extraer tokens');
  }

  return {
    token_validto: tokenValidtoMatch[1],
    token_id: tokenIdMatch[1],
  };
}

async function convertVideo(videoUrl) {
  try {
    const { token_validto, token_id } = await getInitialData(videoUrl);

    const params = new URLSearchParams({
      url: videoUrl,
      height: '480',
      convert: 'gogogo',
      token_validto,
      token_id,
    });

    const convertUrl = `https://savehub.cc/vidconvert/?${params.toString()}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
      'Referer': 'https://savehub.cc/',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
    };

    const response = await fetchWithCookies(convertUrl, { headers });
    if (!response.ok) {
      throw new Error(`Error en petición de conversión: ${response.status}`);
    }
    const data = await response.json();
    console.log('Respuesta de conversión:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const videoUrl = process.argv[2];
if (!videoUrl) {
  console.error('Por favor, pasa la URL del video como argumento, por ejemplo:');
  console.error('node test.js https://es.pornhub.com/view_video.php?viewkey=64094f8e02c40');
  process.exit(1);
}

convertVideo(videoUrl);