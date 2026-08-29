#!/bin/sh
echo "[boot] shell wrapper"
echo "[boot] cwd=$(pwd)"
echo "[boot] PORT=$PORT API_PORT=$API_PORT NODE_ENV=$NODE_ENV"
echo "[boot] PATH=$PATH"
echo "[boot] which node: $(which node 2>&1 || echo 'NOT FOUND')"
echo "[boot] ls /app/apps/api/node_modules/tsx/dist/cli.mjs: $(ls -la apps/api/node_modules/tsx/dist/cli.mjs 2>&1)"
echo "[boot] starting node..."
exec node -e "console.log('[boot] hello from node'); console.error('[boot] stderr test'); setTimeout(()=>{console.log('[boot] still alive after 5s');process.exit(0)}, 5000)"