// test.js

import axios from 'axios'

const BEARER = 'BbyE+h0O9FPbRpyFVAJ/+jUP3hRv1qp571QIodOjFo46Qq3t8EHrpLOKJaMduZX9'
const POW = 'eyJhbGdvcml0aG0iOiJEZWVwU2Vla0hhc2hWMSIsImNoYWxsZW5nZSI6IjU0ZjIxY2NiMTM0Zjg0NGQyMWY2YjRhNWQyMmFhMjU3MWJhOTc5N2NlZGNmYjQyYTFjZGYxMDhmYWU3NmMyNGIiLCJzYWx0IjoiNzhlNDdiYzgyNzE3OTI3ZDQ0ZDMiLCJhbnN3ZXIiOjM2NzQzLCJzaWduYXR1cmUiOiJkOTE5MjE5M2QyZjg3MmE1M2FlMTRiMGRiNmI0NDQzNmEzYjA2MzcwOTc1NzI4NTZiMjcwYWY1YWVhYTRiZjUyIiwidGFyZ2V0X3BhdGgiOiIvYXBpL3YwL2NoYXQvY29tcGxldGlvbiJ9'

async function test() {
  try {
    const res = await axios.post('https://chat.deepseek.com/api/v0/chat/completion', {
      chat_session_id: 'fadf1d9f-9d4f-4261-8fc6-d105d98c39b5',
      parent_message_id: null,
      model_type: 'default',
      prompt: 'hola',
      ref_file_ids: [],
      thinking_enabled: false,
      search_enabled: false,
      action: null,
      preempt: false
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
        'Accept': '*/*',
        'x-ds-pow-response': POW,
        'x-client-platform': 'web',
        'x-client-version': '2.0.0',
        'authorization': `Bearer ${BEARER}`,
        'content-type': 'application/json',
        'Origin': 'https://chat.deepseek.com',
        'Referer': 'https://chat.deepseek.com/',
        'Cookie': 'ds_session_id=d393768dbd14484287ecbe9533641618'
      },
      responseType: 'stream',
      timeout: 30000
    })

    console.log('📦 Status:', res.status)
    console.log('📦 Headers:', JSON.stringify(res.headers, null, 2))

    res.data.on('data', (chunk) => {
      console.log('📝 Chunk:', chunk.toString().slice(0, 200))
    })

    res.data.on('end', () => console.log('✅ Fin'))

  } catch (err) {
    console.error('❌ Error:', err.response?.status, err.message)
    if (err.response?.data) {
      const text = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)
      console.error('Data:', text.slice(0, 500))
    }
  }
}

test()