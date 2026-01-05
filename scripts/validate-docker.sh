#!/bin/bash
set -e

echo "🔍 Validation de la configuration Docker pour Linxio Task"
echo "========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}❌ Fichier manquant: $1${NC}"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✅ Fichier présent: $1${NC}"
        return 0
    fi
}

# Function to validate YAML syntax
validate_yaml() {
    if command -v docker-compose &> /dev/null; then
        if docker-compose config > /dev/null 2>&1; then
            echo -e "${GREEN}✅ docker-compose.yml - Syntaxe YAML valide${NC}"
            return 0
        else
            echo -e "${RED}❌ docker-compose.yml - Erreur de syntaxe YAML${NC}"
            docker-compose config 2>&1 | head -20
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  docker-compose non installé - impossible de valider la syntaxe${NC}"
        ((WARNINGS++))
        return 1
    fi
}

echo "📁 Vérification des fichiers essentiels..."
echo ""

# Check essential files
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file "docker/entrypoint.sh"
check_file "env.example"
check_file ".dockerignore"
check_file "package.json"
check_file "backend/package.json"
check_file "frontend/package.json"
check_file "backend/prisma/schema.prisma"

echo ""
echo "🔍 Vérification de la syntaxe..."
echo ""

# Validate YAML
validate_yaml

echo ""
echo "📋 Vérification des configurations..."
echo ""

# Check Dockerfile syntax
if grep -q "FROM node:" Dockerfile; then
    echo -e "${GREEN}✅ Dockerfile - Image de base Node.js détectée${NC}"
else
    echo -e "${RED}❌ Dockerfile - Image de base manquante${NC}"
    ((ERRORS++))
fi

# Check entrypoint script
if [ -f "docker/entrypoint.sh" ]; then
    if [ -x "docker/entrypoint.sh" ] || grep -q "#!/bin/sh" "docker/entrypoint.sh"; then
        echo -e "${GREEN}✅ entrypoint.sh - Script d'initialisation présent${NC}"
    else
        echo -e "${YELLOW}⚠️  entrypoint.sh - Script non exécutable (sera corrigé lors du build)${NC}"
        ((WARNINGS++))
    fi
fi

# Check environment variables in docker-compose
if grep -q "JWT_SECRET" docker-compose.yml && grep -q "ENCRYPTION_KEY" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml - Variables de sécurité présentes${NC}"
else
    echo -e "${RED}❌ docker-compose.yml - Variables de sécurité manquantes${NC}"
    ((ERRORS++))
fi

# Check database configuration
if grep -q "DATABASE_URL" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml - Configuration de base de données présente${NC}"
else
    echo -e "${RED}❌ docker-compose.yml - Configuration de base de données manquante${NC}"
    ((ERRORS++))
fi

# Check volumes
if grep -q "volumes:" docker-compose.yml && grep -q "postgres_data:" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml - Volumes configurés${NC}"
else
    echo -e "${RED}❌ docker-compose.yml - Volumes manquants${NC}"
    ((ERRORS++))
fi

# Check healthchecks
if grep -q "healthcheck:" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml - Health checks configurés${NC}"
else
    echo -e "${YELLOW}⚠️  docker-compose.yml - Health checks manquants${NC}"
    ((WARNINGS++))
fi

echo ""
echo "🔐 Vérification de la sécurité..."
echo ""

# Check for default passwords
if grep -q "change_this" env.example; then
    echo -e "${GREEN}✅ env.example - Contient des placeholders pour les secrets${NC}"
else
    echo -e "${YELLOW}⚠️  env.example - Vérifiez que les secrets par défaut sont remplacés${NC}"
    ((WARNINGS++))
fi

# Check .dockerignore
if [ -f ".dockerignore" ]; then
    if grep -q ".env" .dockerignore; then
        echo -e "${GREEN}✅ .dockerignore - Exclut les fichiers sensibles${NC}"
    else
        echo -e "${YELLOW}⚠️  .dockerignore - Vérifiez que .env est exclu${NC}"
        ((WARNINGS++))
    fi
fi

echo ""
echo "📦 Vérification des dépendances..."
echo ""

# Check if package.json has required scripts
if grep -q "\"build\"" package.json && grep -q "\"start\"" package.json; then
    echo -e "${GREEN}✅ package.json - Scripts essentiels présents${NC}"
else
    echo -e "${RED}❌ package.json - Scripts essentiels manquants${NC}"
    ((ERRORS++))
fi

# Check backend package.json
if [ -f "backend/package.json" ]; then
    if grep -q "\"prisma:generate\"" backend/package.json; then
        echo -e "${GREEN}✅ backend/package.json - Script Prisma présent${NC}"
    else
        echo -e "${RED}❌ backend/package.json - Script Prisma manquant${NC}"
        ((ERRORS++))
    fi
fi

# Check frontend package.json
if [ -f "frontend/package.json" ]; then
    if grep -q "\"build\"" frontend/package.json; then
        echo -e "${GREEN}✅ frontend/package.json - Script build présent${NC}"
    else
        echo -e "${RED}❌ frontend/package.json - Script build manquant${NC}"
        ((ERRORS++))
    fi
fi

echo ""
echo "🌐 Vérification de la compatibilité Hostinger..."
echo ""

# Check for Hostinger-specific requirements
if grep -q "restart: unless-stopped" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml - Restart policy configurée${NC}"
else
    echo -e "${YELLOW}⚠️  docker-compose.yml - Restart policy recommandée${NC}"
    ((WARNINGS++))
fi

# Check port configuration
if grep -q "APP_PORT" docker-compose.yml || grep -q "3000:3000" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml - Ports configurés${NC}"
else
    echo -e "${RED}❌ docker-compose.yml - Configuration de port manquante${NC}"
    ((ERRORS++))
fi

# Check network configuration
if grep -q "networks:" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml - Réseaux configurés${NC}"
else
    echo -e "${YELLOW}⚠️  docker-compose.yml - Réseaux recommandés${NC}"
    ((WARNINGS++))
fi

echo ""
echo "========================================================="
echo "📊 Résumé de la validation"
echo "========================================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    echo ""
    echo "🎉 La configuration Docker est prête pour le déploiement sur Hostinger !"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) détecté(s)${NC}"
    echo ""
    echo "✅ Aucune erreur critique. La configuration devrait fonctionner."
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) détecté(s)${NC}"
    fi
    echo ""
    echo "🔧 Veuillez corriger les erreurs avant de déployer."
    exit 1
fi


