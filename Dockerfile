FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm@9

WORKDIR /app

# Copy root + all package.jsons
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.base.json ./

# Install all workspace deps (--recursive ensures nested workspaces)
RUN pnpm install --recursive --prefer-offline

# Verify critical deps
RUN test -f /app/node_modules/tsx/dist/cli.mjs || (echo "tsx missing" && exit 1) && \
    test -f /app/node_modules/fastify/package.json || (echo "fastify missing" && exit 1) && \
    test -f /app/node_modules/drizzle-orm/package.json || (echo "drizzle-orm missing" && exit 1) && \
    echo "[install] all critical deps present"

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV PATH="/app/node_modules/.bin:/usr/local/bin:$PATH"

EXPOSE 3001

CMD ["sh", "/app/apps/api/boot.sh"]
