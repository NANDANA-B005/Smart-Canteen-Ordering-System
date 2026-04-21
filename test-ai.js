const http = require('http');

const testCases = [
    'sweet',
    'savory',
    'sweet meal',
    'spicy drink'
];

async function runTests() {
    for (let msg of testCases) {
        const body = JSON.stringify({ message: msg });
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/chatbot/ask',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log('\n--- Test: "' + msg + '" ---');
                try {
                    const parsed = JSON.parse(data);
                    console.log('REPLY:', parsed.reply);
                    if (parsed.recommendations && parsed.recommendations.length > 0) {
                        console.log('REC:', parsed.recommendations.map(r => r.name).join(', '));
                    } else {
                        console.log('REC: []');
                    }
                } catch(e) {
                    console.log(data);
                }
            });
        });

        req.write(body);
        req.end();
        await new Promise(r => setTimeout(r, 500));
    }
}
runTests();
