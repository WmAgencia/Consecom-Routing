# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy and install dependencies
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build API
RUN cd apps/api && pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/apps/api/boot.sh ./apps/api/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run migrations and start
RUN chmod +x apps/api/boot.sh
CMD ["sh", "-c", "cd /app/packages/db && node ../apps/api/node_modules/tsx/dist/cli.mjs src/scripts/migrate.ts && cd /app/apps/api && node node_modules/tsx/dist/cli.mjs src/main.ts"]
