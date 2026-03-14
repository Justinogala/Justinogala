// Vite plugin for Kubernetes health check endpoints
// Replaces the webpack-based health check system

export default function viteHealthCheckPlugin() {
  const startTime = Date.now();
  let isReady = false;

  return {
    name: 'vite-health-check',
    configureServer(server) {
      // Mark as ready once the server starts
      isReady = true;

      server.middlewares.use('/health/ready', (req, res) => {
        if (isReady) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ready: true, state: 'success' }));
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ready: false, state: 'starting' }));
        }
      });

      server.middlewares.use('/health/live', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ alive: true, timestamp: new Date().toISOString() }));
      });

      server.middlewares.use('/health/simple', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      });

      server.middlewares.use('/health', (req, res, next) => {
        // Only handle exact /health path, not /health/* subpaths
        if (req.url && req.url !== '/' && req.url !== '') {
          return next();
        }
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: { seconds: uptime },
          vite: { state: 'success', isHealthy: true }
        }));
      });

      console.log('[Health Check] Vite health endpoints ready: /health, /health/ready, /health/live, /health/simple');
    }
  };
}
