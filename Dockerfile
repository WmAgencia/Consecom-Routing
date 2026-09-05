FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm@9

WORKDIR /app

# Copy dependency files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install ALL dependencies including tsx (needed at runtime)
RUN pnpm install --no-frozen-lockfile

# Verify install
RUN ls /app/node_modules/tsx/dist/cli.mjs && \
    ls /app/node_modules/.pnpm | head -3 && \
    echo "[install] ok"

# Copy source
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.base.json ./

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV PATH="/app/node_modules/.bin:/usr/local/bin:$PATH"

EXPOSE 3001

# Run via boot.sh
CMD ["sh", "/app/apps/api/boot.sh"]
