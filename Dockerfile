# Multi-stage Dockerfile for NestJS API/Worker Monorepo using Bun
FROM oven/bun:alpine AS base
WORKDIR /app

# Install build dependencies (for compiling packages if needed)
RUN apk add --no-cache python3 make g++ openjdk11-jre openssl

# Copy workspace configurations and package files
COPY package.json bun.lock tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/drivers/package.json ./packages/drivers/
COPY packages/types/package.json ./packages/types/

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy all source files
COPY . .

# Generate Prisma Client
RUN bun --cwd packages/database prisma generate

# Build workspaces
RUN bun run --cwd packages/config build || true
RUN bun run --cwd packages/types build || true
RUN bun run --cwd packages/drivers build || true
RUN bun run --cwd apps/api build
RUN bun run --cwd apps/worker build

EXPOSE 3000

# Set entrypoint to run migrations
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command (can be overridden in docker-compose)
CMD ["bun", "run", "--cwd", "apps/api", "start:prod"]
