#!/bin/bash
# Frontend startup script for both preview and production environments

# Ensure node_modules are accessible from /app
if [ ! -d "/app/node_modules" ] && [ -d "/app/frontend/node_modules" ]; then
    ln -sf /app/frontend/node_modules /app/node_modules
    echo "[startup] Symlinked /app/frontend/node_modules -> /app/node_modules"
fi

# If still no node_modules at /app, install from /app/package.json
if [ ! -d "/app/node_modules" ]; then
    echo "[startup] Installing dependencies at /app..."
    cd /app && yarn install 2>&1
fi

cd /app
exec node node_modules/.bin/vite --host :: --port 3000
