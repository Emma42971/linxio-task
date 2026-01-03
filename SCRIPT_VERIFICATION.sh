#!/bin/bash

# =============================================================================
# Script de Vérification Complète - Linxio Task
# =============================================================================

set -e

echo "🔍 Analyse Complète du Projet Linxio Task"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0
SUCCESS=0

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ ERREUR:${NC} $1"
    ((ERRORS++))
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}⚠️  AVERTISSEMENT:${NC} $1"
    ((WARNINGS++))
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅${NC} $1"
    ((SUCCESS++))
}

echo "1️⃣ Vérification des Fichiers Docker"
echo "-----------------------------------"

# Vérifier Dockerfile.prod
if [ -f "Dockerfile.prod" ]; then
    success "Dockerfile.prod existe"
    
    # Vérifier WORKDIR
    if grep -q "WORKDIR /app/linxio-task" Dockerfile.prod; then
        success "WORKDIR correct: /app/linxio-task"
    else
        error "WORKDIR incorrect dans Dockerfile.prod"
    fi
    
    # Vérifier npm ci
    if grep -q "npm ci" Dockerfile.prod; then
        success "Utilise npm ci (reproductible)"
    else
        warning "Dockerfile.prod n'utilise pas npm ci"
    fi
    
    # Vérifier pas de npm install -g npm
    if grep -q "npm install -g npm" Dockerfile.prod; then
        warning "Dockerfile.prod contient 'npm install -g npm' (à éviter)"
    else
        success "Pas de 'npm install -g npm'"
    fi
else
    error "Dockerfile.prod n'existe pas"
fi

# Vérifier docker-compose.prod.yml
if [ -f "docker-compose.prod.yml" ]; then
    success "docker-compose.prod.yml existe"
    
    # Vérifier réseau proxy
    if grep -q "proxy:" docker-compose.prod.yml && grep -q "external: true" docker-compose.prod.yml; then
        success "Réseau proxy externe configuré"
    else
        warning "Réseau proxy non configuré ou non externe"
    fi
    
    # Vérifier expose au lieu de ports pour app
    if grep -A 2 "app:" docker-compose.prod.yml | grep -q "expose:"; then
        success "App utilise 'expose' au lieu de 'ports'"
    else
        warning "App n'utilise pas 'expose'"
    fi
    
    # Vérifier pas de ports pour postgres/redis
    if grep -A 10 "postgres:" docker-compose.prod.yml | grep -q "ports:"; then
        warning "PostgreSQL expose des ports (sécurité)"
    else
        success "PostgreSQL n'expose pas de ports"
    fi
else
    error "docker-compose.prod.yml n'existe pas"
fi

echo ""
echo "2️⃣ Vérification des Références 'taskosaur'"
echo "-------------------------------------------"

# Rechercher toutes les occurrences de taskosaur
TASKOSAUR_COUNT=$(grep -r -i "taskosaur" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.lock" --exclude="SCRIPT_VERIFICATION.sh" 2>/dev/null | wc -l | tr -d ' ')

if [ "$TASKOSAUR_COUNT" -eq "0" ]; then
    success "Aucune référence à 'taskosaur' trouvée"
else
    warning "$TASKOSAUR_COUNT référence(s) à 'taskosaur' trouvée(s)"
    echo "Fichiers concernés :"
    grep -r -i "taskosaur" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.lock" --exclude="SCRIPT_VERIFICATION.sh" 2>/dev/null | cut -d: -f1 | sort -u
fi

echo ""
echo "3️⃣ Vérification des Packages"
echo "----------------------------"

# Vérifier package.json racine
if [ -f "package.json" ]; then
    success "package.json existe"
    
    if grep -q "@linxio-task/platform" package.json; then
        success "Nom de package correct: @linxio-task/platform"
    else
        error "Nom de package incorrect dans package.json"
    fi
else
    warning "package.json n'existe pas (normal si projet vide)"
fi

# Vérifier backend/package.json
if [ -f "backend/package.json" ]; then
    success "backend/package.json existe"
    
    if grep -q "@linxio-task/backend" backend/package.json; then
        success "Nom de package correct: @linxio-task/backend"
    else
        error "Nom de package incorrect dans backend/package.json"
    fi
    
    # Vérifier @nestjs/throttler
    if grep -q "@nestjs/throttler" backend/package.json; then
        THROTTLER_VERSION=$(grep "@nestjs/throttler" backend/package.json | sed -E 's/.*"@nestjs\/throttler":\s*"([^"]+)".*/\1/')
        if [[ "$THROTTLER_VERSION" == *"6."* ]] || [[ "$THROTTLER_VERSION" == *"7."* ]]; then
            success "@nestjs/throttler version correcte: $THROTTLER_VERSION"
        else
            error "@nestjs/throttler version incorrecte: $THROTTLER_VERSION (doit être 6.x ou 7.x)"
        fi
    else
        warning "@nestjs/throttler non trouvé dans backend/package.json"
    fi
else
    warning "backend/package.json n'existe pas"
fi

# Vérifier frontend/package.json
if [ -f "frontend/package.json" ]; then
    success "frontend/package.json existe"
    
    if grep -q "@linxio-task/frontend" frontend/package.json; then
        success "Nom de package correct: @linxio-task/frontend"
    else
        error "Nom de package incorrect dans frontend/package.json"
    fi
else
    warning "frontend/package.json n'existe pas"
fi

echo ""
echo "4️⃣ Vérification des Fichiers de Configuration"
echo "----------------------------------------------"

# Vérifier env.example
if [ -f "env.example" ]; then
    success "env.example existe"
    
    if grep -q "TRUST_PROXY" env.example; then
        success "TRUST_PROXY présent dans env.example"
    else
        warning "TRUST_PROXY absent de env.example"
    fi
    
    if grep -q "https://" env.example; then
        success "URLs HTTPS présentes dans env.example"
    else
        warning "URLs HTTPS absentes de env.example"
    fi
else
    warning "env.example n'existe pas"
fi

echo ""
echo "5️⃣ Vérification Docker Compose"
echo "------------------------------"

# Vérifier syntaxe docker-compose
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    if [ -f "docker-compose.prod.yml" ]; then
        if docker compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
            success "Syntaxe docker-compose.prod.yml valide"
        else
            error "Syntaxe docker-compose.prod.yml invalide"
            docker compose -f docker-compose.prod.yml config 2>&1 | head -20
        fi
    fi
else
    warning "Docker/Docker Compose non installé (test de syntaxe ignoré)"
fi

echo ""
echo "6️⃣ Résumé"
echo "--------"

echo ""
echo "✅ Succès: $SUCCESS"
echo "⚠️  Avertissements: $WARNINGS"
echo "❌ Erreurs: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Le projet est prêt pour le déploiement !${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Des erreurs doivent être corrigées avant le déploiement.${NC}"
    exit 1
fi

