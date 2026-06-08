FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY packages/tokens/package.json ./packages/tokens/
COPY apps/api/package.json ./apps/api/

# Install all workspace deps (needed to build internal packages)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/contracts/src ./packages/contracts/src
COPY packages/contracts/tsconfig.json ./packages/contracts/
COPY packages/core/src ./packages/core/src
COPY packages/core/tsconfig.json ./packages/core/
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Build internal packages then API
RUN pnpm --filter @suppr/contracts build && \
    pnpm --filter @suppr/core build && \
    pnpm --filter @suppr/api build

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/index.js"]
