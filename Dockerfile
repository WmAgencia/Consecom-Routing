FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm@9

WORKDIR /app

# Copy root + all package.jsons + source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.base.json ./

# Install all workspace deps
RUN pnpm install --recursive

# Verify critical deps (pnpm uses .pnpm/<name>@version structure)
RUN ls /app/node_modules/.pnpm/tsx* 2>&1 | head -1 && \
    ls /app/node_modules/.pnpm/fastify* 2>&1 | head -1 && \
    ls /app/node_modules/.pnpm/drizzle-orm* 2>&1 | head -1 && \
    echo "[install] deps verified in pnpm store"

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV PATH="/app/node_modules/.bin:/usr/local/bin:$PATH"

EXPOSE 3001

CMD ["sh", "/app/apps/api/boot.sh"]
