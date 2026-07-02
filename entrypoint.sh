#!/bin/sh
# Entrypoint script for Podmine monorepo container

set -e

# Run migrations only if requested (ideal for API gateway startup)
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "🚀 Running database migrations (Prisma)..."
  bun --cwd packages/database prisma migrate deploy
fi

# Run the passed command (e.g., bun run --cwd apps/api start:prod)
exec "$@"
