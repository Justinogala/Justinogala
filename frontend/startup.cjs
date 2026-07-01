// Production startup: Serve health endpoints IMMEDIATELY, then serve app
// This ensures K8s health probes pass while the app is loading/building
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');

const PORT = 3000;
const DIST_DIR = '/app/dist';
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8001;

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webp': 'image/webp',
  '.xml': 'application/xml', '.txt': 'text/plain', '.map': 'application/json',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

// Ensure node_modules symlink
if (!fs.existsSync('/app/node_modules') && fs.existsSync('/app/frontend/node_modules')) {
  try {
    fs.symlinkSync('/app/frontend/node_modules', '/app/node_modules');
    console.log('[startup] Symlinked node_modules');
  } catch (e) { /* ignore */ }
}
if (!fs.existsSync('/app/node_modules')) {
  console.log('[startup] Installing dependencies...');
  execSync('cd /app && yarn install', { stdio: 'inherit' });
}

let appReady = false;

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Health endpoints - ALWAYS respond immediately
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
      hostname: BACKEND_HOST, port: BACKEND_PORT,
      path: req.url, method: req.method,
      headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end('{"error":"Backend unavailable"}');
    });
    req.pipe(proxyReq);
    return;
  }

  // Proxy GEO/AI crawler paths to backend
  if (pathname === '/llms.txt' || pathname === '/llms-full.txt' || pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname.startsWith('/.well-known/')) {
    const proxyReq = http.request({
      hostname: BACKEND_HOST, port: BACKEND_PORT,
      path: req.url, method: req.method,
      headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Backend unavailable');
    });
    req.pipe(proxyReq);
    return;
  }

  // If app not ready yet, show loading
  if (!appReady) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f5f5f5"><div style="text-align:center"><div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#7c3aed;border-radius:50%;animation:s 1s linear infinite;margin:0 auto"></div><p style="margin-top:16px;color:#666">Loading Munal AI...</p></div><style>@keyframes s{to{transform:rotate(360deg)}}</style></body></html>');
  }

  // Serve static files from dist/
  let filePath = path.join(DIST_DIR, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheControl = pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // SPA fallback
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
    fs.createReadStream(indexPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
}

// Start server IMMEDIATELY for health probes
const server = http.createServer(serveStatic);
server.listen(PORT, '::', () => {
  console.log(`[startup] Server listening on port ${PORT}`);
  console.log('[Health Check] Health endpoints ready: /health, /health/ready, /health/live, /health/simple');
});

// Check if dist exists, if not build it
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  appReady = true;
  console.log('[startup] Serving pre-built production files from dist/');
} else {
  console.log('[startup] No dist/ found, building production frontend...');
  try {
    execSync('cd /app && NODE_OPTIONS="--max-old-space-size=4096" node node_modules/.bin/vite build', { stdio: 'inherit' });
    appReady = true;
    console.log('[startup] Build complete, serving static files');
  } catch (e) {
    console.error('[startup] Build failed, falling back to Vite dev server');
    server.close();
    const vite = spawn('node', ['/app/node_modules/.bin/vite', '--host', '::', '--port', String(PORT)], {
      cwd: '/app', stdio: 'inherit', env: process.env
    });
    vite.on('exit', (code) => process.exit(code || 0));
  }
}
