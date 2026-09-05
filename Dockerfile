FROM node:20-alpine

# Install pnpm and tsx globally
RUN npm install -g pnpm@9 tsx@4

WORKDIR /app

# Copy dependency files first (cache layer)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install all dependencies (tsx is needed at runtime)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.base.json ./

# Build packages
RUN pnpm --filter @consecom/db build 2>&1 || echo "[build] db build skipped" && \
    pnpm --filter @consecom/shared build 2>&1 || echo "[build] shared build skipped"

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV PATH="/usr/local/bin:/app/node_modules/.bin:$PATH"

EXPOSE 3001

# Run migrations + seed + start via boot.sh
CMD ["sh", "/app/apps/api/boot.sh"]
