
import fs from 'fs';
import path from 'path';
// @ts-ignore
import axios from 'axios';

const URLS = [
    'https://surgeflow.ai/',
    'https://techcrunch.com/2025/12/22/chatgpt-everything-to-know-about-the-ai-chatbot/',
    'https://manus.im/blog/edit-slides-created-on-manus-with-nano-banana-pro'
];

async function test() {
    if (!fs.existsSync('test-output')) {
        fs.mkdirSync('test-output');
    }

    for (const url of URLS) {
        console.log(`Testing ${url}...`);
        try {
            const encoded = encodeURIComponent(url);
            // Default is now viewport only
            const res = await axios.get(`http://127.0.0.1:3001/screenshot?url=${encoded}`, {
                responseType: 'arraybuffer',
                timeout: 60000
            });

            if (res.status === 200) {
                const filename = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50) + '.png';
                fs.writeFileSync(path.join('test-output', filename), res.data);
                console.log(`Saved screenshot to test-output/${filename}`);
            } else {
                console.error(`Failed ${url}: ${res.status}`);
            }
        } catch (err: any) {
            console.error(`Error requesting ${url}:`, err.message);
            if (err.response) {
                console.error('Response data:', err.response.data.toString());
            }
        }
    }
}

test();
