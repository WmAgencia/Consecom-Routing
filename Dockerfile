FROM node:20-alpine

# Install pnpm globally + tsx (needed at runtime to run TS files)
# npm install of tsx creates a working executable at /usr/local/bin/tsx
RUN npm install -g pnpm@9 tsx@4

WORKDIR /app

# Copy root + workspaces + source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.base.json ./

# Install all workspace deps
RUN pnpm install --recursive

# Verify tsx works
RUN tsx --version && echo "[install] tsx works"

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV PATH="/usr/local/bin:/app/node_modules/.bin:$PATH"

EXPOSE 3001

CMD ["sh", "/app/apps/api/boot.sh"]
