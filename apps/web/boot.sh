#!/bin/sh
echo "[boot] web shell wrapper"
echo "[boot] cwd=$(pwd)"
echo "[boot] PORT=$PORT NODE_ENV=$NODE_ENV"
echo "[boot] which node: $(which node 2>&1 || echo 'NOT FOUND')"

cd /app/apps/web
echo "[boot] cwd after cd: $(pwd)"
echo "[boot] ls .next: $(ls -la .next 2>&1 | head -3)"
echo "[boot] ls standalone: $(ls -la .next/standalone 2>&1 | head -5)"

# Try multiple paths where Next.js standalone server.js might be
if [ -f ".next/standalone/apps/web/server.js" ]; then
  echo "[boot] found at .next/standalone/apps/web/server.js"
  exec node .next/standalone/apps/web/server.js
elif [ -f ".next/standalone/server.js" ]; then
  echo "[boot] found at .next/standalone/server.js"
  exec node .next/standalone/server.js
elif [ -f "/app/apps/web/.next/standalone/apps/web/server.js" ]; then
  echo "[boot] found at /app/apps/web/.next/standalone/apps/web/server.js"
  exec node /app/apps/web/.next/standalone/apps/web/server.js
else
  echo "[boot] ERROR: server.js not found in any expected location"
  ls -laR /app/apps/web/.next 2>&1 | head -30
  exit 1
fi