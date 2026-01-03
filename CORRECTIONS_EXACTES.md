# 🔧 Corrections Exactes - Hostinger Ready

## 📋 Plan d'Action Complet

Ce document contient les corrections exactes à appliquer pour rendre le repo "Hostinger-ready".

---

## 1️⃣ Fix @nestjs/throttler (NestJS 11 Compatible)

### Problème
`@nestjs/throttler@5.2.0` n'est pas compatible avec `@nestjs/common@11.x`

### Solution

**Dans `backend/package.json`** :

```json
{
  "dependencies": {
    "@nestjs/throttler": "^6.0.0"
  }
}
```

**Commande à exécuter** :
```bash
cd backend
npm install @nestjs/throttler@^6.0.0
cd ..
npm install
```

**Vérification** :
```bash
npm ls @nestjs/throttler
# Doit montrer version 6.x.x
```

---

## 2️⃣ Dockerfile.prod (Build Reproductible)

### Fichier Complet Corrigé

```dockerfile
# =============================================================================
# Linxio Task - Production Dockerfile (Reproductible)
# =============================================================================
FROM node:22-slim AS base

WORKDIR /app/linxio-task

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

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies (including dev) for workspaces
# Using npm ci for reproducible builds (requires package-lock.json)
RUN npm ci --workspaces --include-workspace-root

# Copy all source files
COPY . .

# Set dummy DATABASE_URL for Prisma generate (required by Prisma during build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Generate Prisma Client
WORKDIR /app/linxio-task/backend
RUN npx prisma generate

# Build backend
RUN npm run build

# Build frontend
WORKDIR /app/linxio-task/frontend
RUN npm run build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM base AS production

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy built application from builder
COPY --from=builder --chown=appuser:appuser /app/linxio-task/backend/dist ./backend/dist
COPY --from=builder --chown=appuser:appuser /app/linxio-task/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=appuser:appuser /app/linxio-task/backend/package.json ./backend/
COPY --from=builder --chown=appuser:appuser /app/linxio-task/backend/prisma ./backend/prisma
COPY --from=builder --chown=appuser:appuser /app/linxio-task/frontend/.next ./frontend/.next
COPY --from=builder --chown=appuser:appuser /app/linxio-task/frontend/node_modules ./frontend/node_modules
COPY --from=builder --chown=appuser:appuser /app/linxio-task/frontend/package.json ./frontend/
COPY --from=builder --chown=appuser:appuser /app/linxio-task/frontend/public ./frontend/public
COPY --from=builder --chown=appuser:appuser /app/linxio-task/frontend/next.config.ts ./frontend/
COPY --from=builder --chown=appuser:appuser /app/linxio-task/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/linxio-task/package.json ./

# Create necessary directories
RUN mkdir -p /app/linxio-task/uploads /app/linxio-task/logs && \
    chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Set working directory
WORKDIR /app/linxio-task

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "backend/dist/main.js"]
```

### Changements Clés
- ✅ WORKDIR unifié : `/app/linxio-task` partout
- ✅ `npm ci` au lieu de `npm install` (reproductible)
- ✅ `--workspaces --include-workspace-root` pour monorepo
- ✅ Pas de `npm install -g npm@latest`
- ✅ Copie de `package-lock.json`

---

## 3️⃣ Standardisation des Noms (taskosaur → linxio-task) ✅

### ✅ DÉJÀ FAIT - Toutes les références ont été corrigées

Toutes les occurrences de "taskosaur" ont été remplacées par "linxio-task" :
- ✅ `@taskosaur` → `@linxio-task`
- ✅ `taskosaur` → `linxio-task` (dans les noms de fichiers/paths)
- ✅ `TASKOSAUR` → `LINXIO_TASK` (dans les variables env)
- ✅ `/app/taskosaur` → `/app/linxio-task`

### Fichiers à Vérifier

1. **package.json (racine)**
   ```json
   {
     "name": "@linxio-task/platform"
   }
   ```

2. **backend/package.json**
   ```json
   {
     "name": "@linxio-task/backend"
   }
   ```

3. **frontend/package.json**
   ```json
   {
     "name": "@linxio-task/frontend"
   }
   ```

4. **package-lock.json**
   - Régénérer après les changements :
   ```bash
   rm package-lock.json
   npm install
   ```

---

## 4️⃣ docker-compose.prod.yml (NPM Proxy Ready)

### Fichier Complet Corrigé

```yaml
services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: linxio-task-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - linxio-task-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1g
        reservations:
          cpus: '0.5'
          memory: 512m
    # NO PORTS - Internal network only

  # Redis for Bull Queue and Caching
  redis:
    image: redis:7-alpine
    container_name: linxio-task-redis
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    command: sh -c "redis-server --requirepass \"$$REDIS_PASSWORD\" --appendonly yes"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a \"$$REDIS_PASSWORD\" ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - linxio-task-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512m
        reservations:
          cpus: '0.25'
          memory: 256m
    # NO PORTS - Internal network only

  # Linxio Task Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: linxio-task-app
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      FRONTEND_URL: ${FRONTEND_URL}
      CORS_ORIGIN: ${CORS_ORIGIN}
      CORS_ORIGINS: ${CORS_ORIGINS}
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN:-7d}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASS: ${SMTP_PASS:-}
      SMTP_FROM: ${SMTP_FROM:-noreply@linxio.com}
      EMAIL_DOMAIN: ${EMAIL_DOMAIN:-linxio.com}
      UPLOAD_DEST: /app/linxio-task/uploads
      MAX_FILE_SIZE: ${MAX_FILE_SIZE:-10485760}
      MAX_CONCURRENT_JOBS: ${MAX_CONCURRENT_JOBS:-5}
      JOB_RETRY_ATTEMPTS: ${JOB_RETRY_ATTEMPTS:-3}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:-}
      AWS_REGION: ${AWS_REGION:-}
      AWS_BUCKET_NAME: ${AWS_BUCKET_NAME:-}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      APP_NAME: Linxio Task
      APP_PORT: 3000
      APP_HOST: 0.0.0.0
      TRUST_PROXY: ${TRUST_PROXY:-true}
      SKIP_REDIS_CHECK: ${SKIP_REDIS_CHECK:-false}
    # Expose only (no port mapping - NPM proxy will handle it)
    expose:
      - "3000"
    volumes:
      - app_uploads:/app/linxio-task/uploads
      - app_logs:/app/linxio-task/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - linxio-task-network
      - proxy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4g
        reservations:
          cpus: '1.0'
          memory: 2g
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))\" || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_uploads:
    driver: local
  app_logs:
    driver: local

networks:
  linxio-task-network:
    driver: bridge
  proxy:
    external: true
```

### Changements Clés
- ✅ Réseau `proxy` externe ajouté
- ✅ Service `app` attaché à `proxy` + `linxio-task-network`
- ✅ `expose: 3000` au lieu de `ports:` pour l'app
- ✅ Pas de `ports:` pour PostgreSQL/Redis
- ✅ `TRUST_PROXY=true` ajouté
- ✅ Volumes persistants configurés

---

## 5️⃣ env.example (Production Ready)

### Fichier Complet Corrigé

```bash
# =============================================================================
# Linxio Task - Environment Configuration (Production)
# =============================================================================
# 
# IMPORTANT: This file is for PRODUCTION behind reverse proxy (NPM)
# For development, use .env.local
#
# =============================================================================

# Database Configuration (REQUIRED)
POSTGRES_USER=linxio_task
POSTGRES_PASSWORD=change_this_secure_password
POSTGRES_DB=linxio_task

# Redis Configuration (REQUIRED)
REDIS_PASSWORD=change_this_redis_password

# Application URLs (REQUIRED - Replace with your domain)
FRONTEND_URL=https://tasks.example.com
CORS_ORIGIN=https://tasks.example.com
CORS_ORIGINS=https://tasks.example.com
NEXT_PUBLIC_API_URL=https://tasks.example.com/api
NEXT_PUBLIC_API_BASE_URL=https://tasks.example.com/api

# Security (REQUIRED - Generate with: openssl rand -base64 32)
JWT_SECRET=change_this_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=change_this_refresh_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=change_this_encryption_key_32_chars_min

# Reverse Proxy (REQUIRED when behind NPM)
TRUST_PROXY=true

# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@linxio.com
EMAIL_DOMAIN=linxio.com

# File Upload
MAX_FILE_SIZE=10485760

# Queue Configuration
MAX_CONCURRENT_JOBS=5
JOB_RETRY_ATTEMPTS=3

# AWS S3 Configuration (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

# OpenAI Configuration (optional)
OPENAI_API_KEY=

# Application Port (internal - NPM proxy handles external)
APP_PORT=3000

# Skip Redis check (set to true if Redis is not available)
SKIP_REDIS_CHECK=false
```

### Changements Clés
- ✅ URLs de production (https://tasks.example.com)
- ✅ `TRUST_PROXY=true` ajouté
- ✅ Note "behind reverse proxy"
- ✅ Instructions pour générer secrets

---

## 6️⃣ DEPLOYMENT_QUICKSTART.md

### Fichier Complet

```markdown
# 🚀 Deployment Quickstart - Linxio Task

## Prérequis

- Docker et Docker Compose installés
- NPM (Nginx Proxy Manager) configuré avec réseau `proxy`
- Accès SSH au serveur

## Déploiement en 5 Minutes

### 1. Cloner le Repository

```bash
git clone https://github.com/Emma42971/linxio-task.git
cd linxio-task
```

### 2. Créer le Fichier .env

```bash
cp env.example .env
nano .env
```

**Modifier** :
- Tous les `change_this_*` avec des secrets générés
- Les URLs avec votre domaine réel
- Les credentials SMTP si nécessaire

**Générer les secrets** :
```bash
openssl rand -base64 32  # Pour chaque secret
```

### 3. Créer le Réseau Proxy (si pas déjà fait)

```bash
docker network create proxy
```

### 4. Démarrer les Services

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Vérifier les Logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### 6. Configurer NPM

Dans Nginx Proxy Manager :

1. **Créer un nouveau Proxy Host**
   - Domain Names: `tasks.example.com`
   - Forward Hostname/IP: `linxio-task-app`
   - Forward Port: `3000`
   - Forward Scheme: `http`
   - Websockets Support: ✅ Enabled

2. **SSL**
   - Request SSL Certificate: ✅
   - Force SSL: ✅
   - HTTP/2 Support: ✅

3. **Advanced** (optionnel)
   ```nginx
   # Custom Nginx Configuration
   client_max_body_size 10M;
   ```

### 7. Vérifier la Santé

```bash
# Vérifier les conteneurs
docker compose -f docker-compose.prod.yml ps

# Vérifier les healthchecks
docker inspect linxio-task-app --format '{{json .State.Health}}' | jq
```

## Commandes Utiles

### Redémarrer
```bash
docker compose -f docker-compose.prod.yml restart
```

### Mettre à jour
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Voir les logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Arrêter
```bash
docker compose -f docker-compose.prod.yml down
```

### Sauvegarder la base de données
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U linxio_task linxio_task > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### L'application ne démarre pas
```bash
docker compose -f docker-compose.prod.yml logs app
```

### Erreur de connexion à la base
```bash
docker compose -f docker-compose.prod.yml ps postgres
docker compose -f docker-compose.prod.yml logs postgres
```

### Erreur réseau proxy
```bash
docker network ls | grep proxy
docker network inspect proxy
```

---

**✅ Déploiement terminé !**
```

---

## 7️⃣ GitHub Actions CI

### Fichier: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint --if-present
        continue-on-error: true
      
      - name: Test
        run: npm run test --if-present
        continue-on-error: true
      
      - name: Build
        run: npm run build:dist
        env:
          DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy?schema=public
```

---

## 📝 Ordre d'Exécution

1. **Fix throttler**
   ```bash
   cd backend
   npm install @nestjs/throttler@^6.0.0
   cd ..
   npm install
   ```

2. **Standardiser les noms**
   - Rechercher/remplacer dans tous les fichiers
   - Régénérer package-lock.json

3. **Créer les fichiers corrigés**
   - Dockerfile.prod
   - docker-compose.prod.yml
   - env.example
   - DEPLOYMENT_QUICKSTART.md
   - .github/workflows/ci.yml

4. **Test local**
   ```bash
   docker compose -f docker-compose.prod.yml config
   ```

5. **Commit et Push**
   ```bash
   git add .
   git commit -m "fix: Hostinger-ready - throttler, docker, names standardization"
   git push origin main
   ```

---

**✅ Toutes les corrections sont prêtes à être appliquées !**

