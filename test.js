// test.js

import { Impit } from 'impit'
import crypto from 'crypto'

const API = 'https://api.deepai.org/api/text2img'
const ORIGIN = 'https://deepai.org'
const REFERER = 'https://deepai.org/machine-learning-model/text2img'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
const SALT = 'hackers_become_a_little_stinkier_every_time_they_hack'

function md5rev(input) {
  return crypto.createHash('md5').update(input, 'utf8').digest('hex').split('').reverse().join('')
}

function generateIslandKey(userAgent = UA) {
  const rand = Math.round(Math.random() * 100000000000) + ''
  const inner = md5rev(userAgent + rand + SALT)
  const mid = md5rev(userAgent + inner)
  const outer = md5rev(userAgent + mid)
  return 'tryit-' + rand + '-' + outer
}

function getHeaders(key) {
  return {
    'api-key': key,
    'user-agent': UA,
    origin: ORIGIN,
    referer: REFERER,
  }
}

const client = new Impit({ browser: 'chrome' })

async function text2img(prompt) {
  const key = generateIslandKey()
  const fd = new FormData()
  fd.append('text', prompt)
  fd.append('width', '640')
  fd.append('height', '640')
  fd.append('image_generator_version', 'hd')
  fd.append('use_new_model', 'false')
  fd.append('use_old_model', 'false')
  fd.append('quality', 'true')
  fd.append('generation_source', 'img')

  const res = await client.fetch(API, {
    method: 'POST',
    headers: getHeaders(key),
    body: fd,
  })
  return res.json()
}

const prompt = process.argv[2] || 'a cute cat wearing a sombrero, digital art'
console.log('🎨 Creando:', prompt)
const out = await text2img(prompt)
console.log(JSON.stringify(out, null, 2))