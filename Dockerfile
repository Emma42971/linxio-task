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

# Update npm to latest version for better workspace support
RUN npm install -g npm@latest

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Copy workspace directories
COPY backend ./backend
COPY frontend ./frontend
COPY scripts ./scripts

# Set dummy DATABASE_URL for Prisma generate (required by Prisma during build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Install dependencies
# Note: npm install handles workspaces automatically
RUN npm install

# Build the distribution using the build script
RUN npm run build:dist

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM base AS production

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy only the dist directory from builder stage (created by build:dist)
COPY --from=builder --chown=appuser:appuser /app/dist .

# Validate that required files exist in the dist folder
RUN if [ ! -f "package.json" ]; then \
        echo "ERROR: dist directory is missing required files (package.json not found)"; \
        exit 1; \
    fi

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
CMD ["node", "dist/main.js"]

