#!/bin/sh
set -e

echo "🚀 Starting Linxio Task..."

# Function to wait for PostgreSQL
wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL to be ready..."

  # Extract database host from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

  max_attempts=30
  attempt=0

  until nc -z "$DB_HOST" "${DB_PORT:-5432}" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ PostgreSQL did not become ready in time"
      exit 1
    fi
    echo "   Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
    sleep 2
  done
  echo "✅ PostgreSQL is ready!"
}

# Function to wait for Redis (optional)
wait_for_redis() {
  if [ "${SKIP_REDIS_CHECK:-false}" = "true" ]; then
    echo "⏭️  Skipping Redis check (SKIP_REDIS_CHECK=true)"
    return 0
  fi

  echo "⏳ Waiting for Redis to be ready..."

  max_attempts=30
  attempt=0

  until nc -z "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "⚠️  Redis did not become ready in time - continuing anyway (Redis is optional)"
      return 0
    fi
    echo "   Waiting for Redis... (attempt $attempt/$max_attempts)"
    sleep 2
  done
  echo "✅ Redis is ready!"
}

# Wait for dependencies
wait_for_postgres
wait_for_redis

# Generate Prisma Client
echo ""
echo "🔨 Generating Prisma Client..."
# Check if we're in a dist structure or workspace structure
if [ -d "/app/backend" ]; then
  cd /app/backend
else
  # We're in dist structure, prisma should be in /app/prisma
  cd /app
fi
npx prisma generate || {
  echo "⚠️  Prisma generate failed or already done"
}

# Run database migrations
echo ""
echo "🗃️  Deploying database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration deployment failed or already up to date"
}

# Return to app directory
cd /app

echo ""
echo "✅ Bootstrap completed!"
echo ""
echo "🎯 Starting Linxio Task server..."

# Execute the command
exec "$@"
