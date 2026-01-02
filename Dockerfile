# =============================================================================
# Linxio Task - Production Dockerfile
# =============================================================================
FROM node:22-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    netcat-openbsd \
    openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM base AS builder

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies (including dev) for workspaces
# Note: Using npm install instead of npm ci for better workspace compatibility
# If package-lock.json is out of sync, it will be updated automatically
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy all source files
COPY . .

# Remove .env and other sensitive files if they exist
RUN rm -f .env .env.local .env.*.local || true

# Set dummy DATABASE_URL for Prisma generate
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Generate Prisma Client
WORKDIR /app/backend
RUN npx prisma generate

# Build backend
RUN npm run build

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# =============================================================================
# Stage 3: Production
# =============================================================================
FROM base AS production

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy built application from builder
COPY --from=builder --chown=appuser:appuser /app/backend/dist ./backend/dist
COPY --from=builder --chown=appuser:appuser /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=appuser:appuser /app/backend/package.json ./backend/
COPY --from=builder --chown=appuser:appuser /app/backend/prisma ./backend/prisma
COPY --from=builder --chown=appuser:appuser /app/frontend/.next ./frontend/.next
COPY --from=builder --chown=appuser:appuser /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder --chown=appuser:appuser /app/frontend/package.json ./frontend/
COPY --from=builder --chown=appuser:appuser /app/frontend/public ./frontend/public
COPY --from=builder --chown=appuser:appuser /app/frontend/server.js ./frontend/
COPY --from=builder --chown=appuser:appuser /app/frontend/next.config.ts ./frontend/
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/package.json ./
COPY --from=builder --chown=appuser:appuser /app/package-lock.json ./

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "backend/dist/main.js"]

