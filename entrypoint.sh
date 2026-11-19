#!/bin/sh
# Entrypoint script for Podmine monorepo container

set -e

# Schema sync is handled automatically by TypeORM when RUN_MIGRATIONS is set to true on startup
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "🚀 Database schema sync enabled via TypeORM..."
fi

# Run the passed command (e.g., bun run --cwd apps/api start:prod)
exec "$@"
