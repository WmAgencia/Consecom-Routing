FROM node:20-alpine

# Install pnpm globally + tsx (needed at runtime to run TS files)
RUN npm install -g pnpm@9 tsx@4 && \
    ln -sf /usr/local/lib/node_modules/tsx/dist/cli.mjs /usr/local/bin/tsx-runner.mjs && \
    echo '#!/bin/sh' > /usr/local/bin/tsx && \
    echo 'exec node /usr/local/lib/node_modules/tsx/dist/cli.mjs "$@"' >> /usr/local/bin/tsx && \
    chmod +x /usr/local/bin/tsx && \
    echo "[setup] tsx installed globally"

WORKDIR /app

# Copy root + workspaces + source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.base.json ./

# Install all workspace deps (devDeps included for tsx availability)
RUN pnpm install --recursive && \
    echo "[install] pnpm install complete"

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3001
ENV PATH="/app/node_modules/.bin:/usr/local/bin:$PATH"

EXPOSE 3001

CMD ["sh", "/app/apps/api/boot.sh"]
