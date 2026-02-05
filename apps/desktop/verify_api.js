const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 8000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000 // 5s timeout
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        console.log(`\n${method} http://${options.hostname}:${options.port}${path}`);

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => {
            console.error(`PROBLEM with request: ${e.message}`);
            reject(e);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function verify() {
    console.log('--- Verify Python API ---');

    // 1. Health
    try {
        const health = await makeRequest('/health/');
        console.log('Health Body:', health.body);
    } catch (e) {
        console.error('Health Check Failed');
    }

    // 2. Ask (Dry run)
    try {
        const body = JSON.stringify({
            question: 'test',
            mode: 'answer',
            top_k: 1
        });
        const ask = await makeRequest('/ask/', 'POST', body);
        console.log('Ask Body Preview:', ask.body.substring(0, 100));
    } catch (e) {
        console.error('Ask Check Failed');
    }
}

verify();
