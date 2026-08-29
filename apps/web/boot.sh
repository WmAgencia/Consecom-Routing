#!/bin/sh
echo "[boot] web shell wrapper"
echo "[boot] cwd=$(pwd)"
echo "[boot] PORT=$PORT NODE_ENV=$NODE_ENV"
echo "[boot] which node: $(which node 2>&1 || echo 'NOT FOUND')"
echo "[boot] ls server.js: $(ls -la /app/apps/web/.next/standalone/apps/web/server.js 2>&1 || echo 'NOT FOUND')"
echo "[boot] starting next standalone server..."
cd /app/apps/web && exec node .next/standalone/apps/web/server.js