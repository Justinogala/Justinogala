// Frontend startup script - ensures node_modules symlink and starts vite
const fs = require('fs');
const { execSync, spawn } = require('child_process');

// Ensure node_modules are accessible from /app
if (!fs.existsSync('/app/node_modules') && fs.existsSync('/app/frontend/node_modules')) {
  try {
    fs.symlinkSync('/app/frontend/node_modules', '/app/node_modules');
    console.log('[startup] Symlinked /app/frontend/node_modules -> /app/node_modules');
  } catch (e) {
    console.log('[startup] Symlink already exists or failed:', e.message);
  }
}

// If still no node_modules, install
if (!fs.existsSync('/app/node_modules')) {
  console.log('[startup] Installing dependencies...');
  execSync('cd /app && yarn install', { stdio: 'inherit' });
}

// Start vite from /app
const vite = spawn('node', ['/app/node_modules/.bin/vite', '--host', '::', '--port', '3000'], {
  cwd: '/app',
  stdio: 'inherit',
  env: process.env
});

vite.on('exit', (code) => process.exit(code || 0));
