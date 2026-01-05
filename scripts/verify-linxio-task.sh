#!/bin/bash

# Script de vérification finale pour Linxio Task
# Vérifie que toutes les références à "taskosaur" ont été remplacées par "linxio-task"

set -e

echo "🔍 Vérification finale de Linxio Task..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

ERRORS=0
WARNINGS=0

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour compter les erreurs
error() {
    echo -e "${RED}❌ ERREUR:${NC} $1"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  AVERTISSEMENT:${NC} $1"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

# 1. Vérifier les fichiers Docker critiques
echo "📦 Vérification des fichiers Docker..."
echo "─────────────────────────────────────────────────────────────"

# Dockerfile.prod
if grep -q "taskosaur" Dockerfile.prod 2>/dev/null; then
    error "Dockerfile.prod contient encore 'taskosaur'"
else
    success "Dockerfile.prod - OK"
fi

# docker-compose.yml
if grep -qi "taskosaur" docker-compose.yml 2>/dev/null; then
    error "docker-compose.yml contient encore 'taskosaur'"
else
    success "docker-compose.yml - OK"
fi

# docker-compose.prod.yml
if grep -qi "taskosaur" docker-compose.prod.yml 2>/dev/null; then
    error "docker-compose.prod.yml contient encore 'taskosaur'"
else
    success "docker-compose.prod.yml - OK"
fi

# docker-compose.dev.yml
if grep -qi "taskosaur" docker-compose.dev.yml 2>/dev/null; then
    error "docker-compose.dev.yml contient encore 'taskosaur'"
else
    success "docker-compose.dev.yml - OK"
fi

echo ""

# 2. Vérifier les package.json
echo "📋 Vérification des package.json..."
echo "─────────────────────────────────────────────────────────────"

if grep -q "@taskosaur" package.json 2>/dev/null; then
    error "package.json racine contient '@taskosaur'"
else
    success "package.json racine - OK"
fi

if grep -q "@taskosaur" backend/package.json 2>/dev/null; then
    error "backend/package.json contient '@taskosaur'"
else
    success "backend/package.json - OK"
fi

if grep -q "@taskosaur" frontend/package.json 2>/dev/null; then
    error "frontend/package.json contient '@taskosaur'"
else
    success "frontend/package.json - OK"
fi

echo ""

# 3. Vérifier les scripts
echo "🔧 Vérification des scripts..."
echo "─────────────────────────────────────────────────────────────"

if grep -qi "taskosaur" scripts/postinstall.js 2>/dev/null; then
    error "scripts/postinstall.js contient 'taskosaur'"
else
    success "scripts/postinstall.js - OK"
fi

if grep -qi "taskosaur" scripts/generate-logo-icons.js 2>/dev/null; then
    error "scripts/generate-logo-icons.js contient 'taskosaur'"
else
    success "scripts/generate-logo-icons.js - OK"
fi

echo ""

# 4. Vérifier les fichiers de configuration
echo "⚙️  Vérification des fichiers de configuration..."
echo "─────────────────────────────────────────────────────────────"

if grep -qi "taskosaur" docker/entrypoint.sh 2>/dev/null; then
    error "docker/entrypoint.sh contient 'taskosaur'"
else
    success "docker/entrypoint.sh - OK"
fi

echo ""

# 5. Vérifier la syntaxe YAML
echo "📝 Vérification de la syntaxe YAML..."
echo "─────────────────────────────────────────────────────────────"

if command -v docker-compose &> /dev/null; then
    if docker-compose -f docker-compose.yml config > /dev/null 2>&1; then
        success "docker-compose.yml - Syntaxe YAML valide"
    else
        error "docker-compose.yml - Erreur de syntaxe YAML"
    fi
    
    if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
        success "docker-compose.prod.yml - Syntaxe YAML valide"
    else
        error "docker-compose.prod.yml - Erreur de syntaxe YAML"
    fi
    
    if docker-compose -f docker-compose.dev.yml config > /dev/null 2>&1; then
        success "docker-compose.dev.yml - Syntaxe YAML valide"
    else
        error "docker-compose.dev.yml - Erreur de syntaxe YAML"
    fi
else
    warning "docker-compose non installé - impossible de valider la syntaxe YAML"
fi

echo ""

# 6. Vérifier que les noms de conteneurs sont cohérents
echo "🐳 Vérification des noms de conteneurs..."
echo "─────────────────────────────────────────────────────────────"

if grep -q "container_name: linxio-task" docker-compose.yml 2>/dev/null; then
    success "Noms de conteneurs - OK"
else
    warning "Vérifiez manuellement les noms de conteneurs dans docker-compose.yml"
fi

echo ""

# 7. Vérifier les réseaux Docker
echo "🌐 Vérification des réseaux Docker..."
echo "─────────────────────────────────────────────────────────────"

if grep -q "linxio-task-network" docker-compose.yml 2>/dev/null; then
    success "Réseau Docker - OK"
else
    error "Réseau Docker 'linxio-task-network' non trouvé"
fi

echo ""

# Résumé
echo "═══════════════════════════════════════════════════════════════"
echo "📊 RÉSUMÉ"
echo "═══════════════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Toutes les vérifications ont réussi !${NC}"
    echo ""
    echo "Le projet est prêt pour le déploiement sur Hostinger."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) - Vérifiez manuellement${NC}"
    echo ""
    echo "Le projet devrait fonctionner, mais vérifiez les avertissements ci-dessus."
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) trouvée(s)${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
    fi
    echo ""
    echo "Veuillez corriger les erreurs avant de déployer."
    exit 1
fi

