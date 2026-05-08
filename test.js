import axios from 'axios';
import * as cheerio from 'cheerio';

async function descargarVideoFB(videoUrl) {
    // Estos tokens son los que sacaste del cURL funcional. 
    // Si fallan, necesitaremos capturarlos una vez manualmente cada vez que cambien.
    const tokens = {
        k_exp: '1778102017',
        k_token: 'b18328949b1526bc79a252a6349c50592012597e248a980baca8bd3169415413',
        cftoken: '0.qx-vbirN_rCItbzzgSPCejt7etbh1SowgCz8mG-ylqqNBMPyeGCbN42FWZiiPNldcwORxlNBVkt9_rc6BBJ4FhrCAO_wvSXDKJZp2rRO-Pq9c8XRo3DdvOBPtFJvxwHS1cqy-jhk6VFkkLGMEBjAVFWzB4n-DY1EOel_VJheM6aE9Df1CNx-p-LDUypvJnV9iebgOGIXl2jB5kL4P08RNldDQLD0PIEVsijSpEniqSIUbFxFADNGxXr8RPGc5ZMV5Q0rArRFdJ9QCgLyiqQhFpCE3iInZLGC75zBTnBfFWKzIJEzurNbbAAQUXDxuyD8SPFvoQZq4a-CaH1wOsiLN8XjzicKBaBBHulZ-6cw5A3Ug77JXvRdzhlW7hgEQa5GbMex2Z3OkiFicXusEjbMhJF0AscBljxg0BBYcUOVKNv8QKVREq2G3Mwc140liyotXPQDSLnfMJOGVtFucbbKq1GtoURORlogd1_7B6RtCnUPhLJPDqfR9hRskmB-YMFKGrA-IVR3CCzxcs5_EVQ2JRL_YRwI4-CZ9XW959uJemLzmudkvwjrNY0zQ014kvfXr1WR8jtIE0sXTyerWo6PXw7wo_XLWLoGgF6ZA_5yjH1_-KqYtJodkIiZtL02y57e85nUY9evM_8bmsd3XW3Sy84k-r-srirGvOS7XdsDiiXl-_iFVF6BU54DzqR-LSfUikvtZG2NHuLTkrBTgseATTfgATYgDWEBggkGtpPKdpX5tQLWLToSKy4JXAT7mfaM62tEG_5kDKCJY1s5eVsCvhG1t9eCwuYrchJHjXuiVfARH1jb4hkIT7nqVrzxDmdw_9aOASca4mEOYBE4TKJyi625d0PzWcJRXH66NoxYftMPedDDanVBHCbrYQAXXLnmpJE8xnwr3zT13b3pZ3OFwf0Rkmdk12v98SyPiWC8LqF8u7UDAWRefFt7xH_ncigc.QD_hy0lR8fKtjb_iMXvIAA.5b69d95eb58f0468ff626d459cc1ebda61bcaaa865c0dfb32dd71e7f0faf2b91'
    };

    try {
        console.log(`[!] Consultando API para: ${videoUrl}`);

        const payload = new URLSearchParams({
            'k_exp': tokens.k_exp,
            'k_token': tokens.k_token,
            'cftoken': tokens.cftoken,
            'q': videoUrl,
            'lang': 'es',
            'web': 'fdownloader.net',
            'v': 'v2'
        });

        const response = await axios.post('https://v3.fdownloader.net/api/ajaxSearch', payload, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
                'Accept': '*/*',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://fdownloader.net',
                'Referer': 'https://fdownloader.net/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Priority': 'u=1'
            }
        });

        if (response.data.status !== 'ok') {
            console.error("[-] Error en respuesta:", response.data.mes || "Token inválido o expirado.");
            return;
        }

        const $ = cheerio.load(response.data.data);
        const results = [];

        // Extraemos los links de la tabla de resultados
        $('table tbody tr').each((i, el) => {
            const quality = $(el).find('.video-quality').text().trim();
            const downloadUrl = $(el).find('a.download-link-fb').attr('href') || 
                               $(el).find('button').attr('data-videourl');

            if (downloadUrl) {
                results.push({ quality, url: downloadUrl });
            }
        });

        console.log("\n[+] Enlaces listos para enviar:");
        results.forEach((res, index) => {
            console.log(`${index + 1}. ${res.quality}: ${res.url.substring(0, 80)}...`);
        });

    } catch (error) {
        console.error("[-] Error crítico:", error.message);
    }
}

const fb_url = 'https://web.facebook.com/share/v/1DvB472EFb/';
descargarVideoFB(fb_url);