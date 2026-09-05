#!/bin/sh
set -e

echo "[boot] starting at $(date)"

# Use tsx from local pnpm .bin (installed via pnpm install)
export PATH="/app/node_modules/.bin:$PATH"

# Run migrations
echo "[boot] running migrations..."
cd /app/packages/db
tsx src/scripts/migrate.ts 2>&1 || {
  echo "[boot] migrate FAILED, but continuing to seed/server"
}

# Run seed
echo "[boot] seeding (idempotent)..."
tsx src/scripts/seed.ts 2>&1 || {
  echo "[boot] seed failed, continuing to server"
}

echo "[boot] starting API server..."
cd /app/apps/api
exec tsx src/main.ts
