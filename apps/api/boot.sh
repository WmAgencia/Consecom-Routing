#!/bin/sh
echo "[boot] tsx wrapper starting"
echo "[boot] cwd=$(pwd)"
echo "[boot] PORT=$PORT API_PORT=$API_PORT NODE_ENV=$NODE_ENV"
exec node apps/api/node_modules/tsx/dist/cli.mjs apps/api/src/main.ts