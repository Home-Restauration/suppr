FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/tokens/package.json ./packages/tokens/
COPY apps/bot/package.json ./apps/bot/

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/contracts/src ./packages/contracts/src
COPY packages/contracts/tsconfig.json ./packages/contracts/
COPY apps/bot/src ./apps/bot/src
COPY apps/bot/tsconfig.json ./apps/bot/

# Build internal packages then bot
RUN pnpm --filter @suppr/contracts build && \
    pnpm --filter @suppr/bot build

WORKDIR /app/apps/bot

EXPOSE 3002

CMD ["node", "dist/index.js"]
