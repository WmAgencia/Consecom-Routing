#!/bin/sh
set -e

echo "[boot] starting..."
cd /app/apps/api
exec node node_modules/tsx/dist/cli.mjs src/main.ts