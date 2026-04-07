// Production-ready static file server with health checks and API proxy
// Used when dist/ exists (post-build). Falls back to Vite dev server otherwise.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');

const PORT = 3000;
const DIST_DIR = '/app/dist';
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8001;

// Ensure node_modules symlink
if (!fs.existsSync('/app/node_modules') && fs.existsSync('/app/frontend/node_modules')) {
  try {
    fs.symlinkSync('/app/frontend/node_modules', '/app/node_modules');
    console.log('[startup] Symlinked node_modules');
  } catch (e) {
    console.log('[startup] Symlink exists or failed:', e.message);
  }
}

if (!fs.existsSync('/app/node_modules')) {
  console.log('[startup] Installing dependencies...');
  execSync('cd /app && yarn install', { stdio: 'inherit' });
}

// Check if we should use static server (dist exists) or Vite dev server
const useStatic = fs.existsSync(path.join(DIST_DIR, 'index.html'));

if (!useStatic) {
  // Fallback: run Vite dev server (preview environment)
  console.log('[startup] No dist/ found, starting Vite dev server...');
  const vite = spawn('node', ['/app/node_modules/.bin/vite', '--host', '::', '--port', String(PORT)], {
    cwd: '/app',
    stdio: 'inherit',
    env: process.env
  });
  vite.on('exit', (code) => process.exit(code || 0));
} else {
  // Production: fast static file server
  console.log('[startup] Serving production build from dist/');

  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.map': 'application/json',
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // Health check endpoints
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString(), vite: { state: 'success', isHealthy: true } }));
    }
    if (pathname === '/health/ready') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ready: true, state: 'success' }));
    }
    if (pathname === '/health/live') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ alive: true, timestamp: new Date().toISOString() }));
    }
    if (pathname === '/health/simple') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('OK');
    }

    // Proxy /api requests to backend
    if (pathname.startsWith('/api')) {
      const proxyReq = http.request({
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend unavailable' }));
      });
      req.pipe(proxyReq);
      return;
    }

    // Serve static files
    let filePath = path.join(DIST_DIR, pathname);

    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const cacheControl = pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback: serve index.html for all non-file routes
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, '::', () => {
    console.log(`[startup] Static server listening on port ${PORT}`);
    console.log('[Health Check] Health endpoints ready: /health, /health/ready, /health/live, /health/simple');
  });
}
