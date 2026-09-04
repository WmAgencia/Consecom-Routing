#!/bin/bash
cd "$(dirname "$0")/apps/web"
pnpm install
node ../node_modules/next/dist/bin/next build
