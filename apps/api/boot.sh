#!/bin/sh
set -e

echo "[boot] starting at $(date)"

# Locate tsx cli in pnpm-managed node_modules
TSX_CLI=$(find /app/node_modules -name "cli.mjs" -path "*/tsx/dist/*" 2>/dev/null | head -1)
if [ -z "$TSX_CLI" ]; then
  TSX_CLI="/app/node_modules/.pnpm/tsx@4.23.13/node_modules/tsx/dist/cli.mjs"
fi
echo "[boot] tsx cli: $TSX_CLI"

# Run migrations from packages/db
echo "[boot] running migrations..."
cd /app/packages/db
node "$TSX_CLI" src/scripts/migrate.ts 2>&1 || {
  echo "[boot] migrate FAILED, but continuing to seed/server"
}

# Run seed
echo "[boot] seeding (idempotent)..."
node "$TSX_CLI" src/scripts/seed.ts 2>&1 || {
  echo "[boot] seed failed, continuing to server"
}

echo "[boot] starting API server..."
cd /app/apps/api
exec node "$TSX_CLI" src/main.ts
