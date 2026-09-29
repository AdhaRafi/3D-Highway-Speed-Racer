/**
 * server.js
 * Zero-dependency local development HTTP server for 3D Highway Speed Racer.
 * Runs instantly with Node.js: `node server.js`
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 8000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.mjs': 'text/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.bin': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
    // Basic CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Clean URL
    let safeUrl = req.url.split('?')[0];

    // API: list all 3D models in models/ folder
    if (safeUrl === '/api/models') {
        const modelsDir = path.join(PUBLIC_DIR, 'models');
        if (!fs.existsSync(modelsDir)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify([]));
            return;
        }
        fs.readdir(modelsDir, (err, files) => {
            if (err) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify([]));
                return;
            }
            const modelFiles = files.filter(f => {
                const ext = path.extname(f).toLowerCase();
                return ext === '.glb' || ext === '.gltf';
            }).map(f => `models/${f}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify(modelFiles));
        });
        return;
    }

    if (safeUrl === '/' || safeUrl === '') {
        safeUrl = '/index.html';
    }

    // Prevent path traversal
    const decodedPath = decodeURIComponent(safeUrl);
    const filePath = path.normalize(path.join(PUBLIC_DIR, decodedPath));

    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end(`404 Not Found: ${safeUrl}`);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.on('error', (err) => {
    const url = `http://localhost:${PORT}`;
    if (err.code === 'EADDRINUSE') {
        console.log(`\n==================================================`);
        console.log(`ℹ️  Server game sudah berjalan di:`);
        console.log(`👉 ${url}`);
        console.log(`Membuka browser sekarang...`);
        console.log(`==================================================\n`);
        const startCmd = process.platform === 'win32' ? `start ${url}` : `open ${url}`;
        exec(startCmd, () => {});
    } else {
        console.error('[ERROR] Gagal menjalankan server:', err);
    }
});

server.listen(PORT, '127.0.0.1', () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n==================================================`);
    console.log(`🚀 3D Highway Speed Racer Server running at:`);
    console.log(`👉 ${url}`);
    console.log(`Tekan Ctrl + C untuk mematikan server.`);
    console.log(`==================================================\n`);

    // Automatically open browser on Windows
    const startCmd = process.platform === 'win32' ? `start ${url}` : `open ${url}`;
    exec(startCmd, (err) => {
        // Silently ignore if browser launch has issues
    });
});
