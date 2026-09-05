#!/bin/sh
set -e

echo "[boot] starting at $(date)"

# Run migrations from packages/db
echo "[boot] running migrations..."
cd /app/packages/db
pnpm exec tsx src/scripts/migrate.ts 2>&1 || {
  echo "[boot] migrate FAILED, but continuing to seed/server"
}

# Run seed
echo "[boot] seeding (idempotent)..."
pnpm exec tsx src/scripts/seed.ts 2>&1 || {
  echo "[boot] seed failed, continuing to server"
}

echo "[boot] starting API server..."
cd /app/apps/api
exec pnpm exec tsx src/main.ts
