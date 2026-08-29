#!/bin/sh
echo "[boot] shell wrapper"
echo "[boot] cwd=$(pwd)"
echo "[boot] PORT=$PORT API_PORT=$API_PORT NODE_ENV=$NODE_ENV"
echo "[boot] PATH=$PATH"
echo "[boot] which node: $(which node 2>&1 || echo 'NOT FOUND')"
echo "[boot] ls /app/apps/api/node_modules/tsx/dist/cli.mjs: $(ls -la apps/api/node_modules/tsx/dist/cli.mjs 2>&1)"
echo "[boot] which sh: $(which sh 2>&1 || echo 'NOT FOUND')"

# Run migrations + seed before starting the server (idempotent).
echo "[boot] running migrations..."
cd /app && node apps/api/node_modules/tsx/dist/cli.mjs packages/db/src/scripts/migrate.ts 2>&1 || echo "[boot] migrate failed, continuing"
echo "[boot] seeding (idempotent)..."
cd /app && node apps/api/node_modules/tsx/dist/cli.mjs packages/db/src/scripts/seed.ts 2>&1 || echo "[boot] seed failed, continuing"

echo "[boot] starting node..."
cd /app/apps/api && exec node ../api/node_modules/tsx/dist/cli.mjs src/main.ts