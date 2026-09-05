#!/bin/sh
set -e

echo "[boot] starting at $(date)"

# Find tsx installation (global npm install)
GLOBAL_TSX=$(npm root -g)/tsx
if [ -d "$GLOBAL_TSX" ]; then
  echo "[boot] using global tsx at $GLOBAL_TSX"
  TSX_BIN="$GLOBAL_TSX/dist/cli.mjs"
else
  echo "[boot] global tsx not found, falling back to local"
  # Try local pnpm store
  TSX_BIN=$(find /app/node_modules -name "cli.mjs" -path "*/tsx/dist/*" 2>/dev/null | head -1)
fi

if [ -z "$TSX_BIN" ] || [ ! -f "$TSX_BIN" ]; then
  echo "[boot] FATAL: tsx not found anywhere"
  exit 1
fi

echo "[boot] tsx binary: $TSX_BIN"

# Run migrations from packages/db
echo "[boot] running migrations..."
cd /app/packages/db
node "$TSX_BIN" src/scripts/migrate.ts 2>&1 || {
  echo "[boot] migrate FAILED, but continuing to seed/server"
}

# Run seed
echo "[boot] seeding (idempotent)..."
node "$TSX_BIN" src/scripts/seed.ts 2>&1 || {
  echo "[boot] seed failed, continuing to server"
}

echo "[boot] starting API server..."
cd /app/apps/api
exec node "$TSX_BIN" src/main.ts
