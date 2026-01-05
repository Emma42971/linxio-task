#!/bin/bash
set -e

echo "🚀 Linxio Task - Docker Setup Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from env.example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env file from env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file and configure your settings before continuing${NC}"
        echo ""
        read -p "Press Enter to continue after editing .env file..."
    else
        echo -e "${RED}❌ env.example file not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Generate secrets if not set
echo ""
echo "🔐 Checking security secrets..."

if grep -q "change_this" .env; then
    echo -e "${YELLOW}⚠️  Default secrets detected. Generating secure secrets...${NC}"
    
    # Generate JWT_SECRET
    if grep -q "change_this_jwt_secret" .env; then
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        echo -e "${GREEN}✅ Generated JWT_SECRET${NC}"
    fi
    
    # Generate JWT_REFRESH_SECRET
    if grep -q "change_this_refresh_secret" .env; then
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
        echo -e "${GREEN}✅ Generated JWT_REFRESH_SECRET${NC}"
    fi
    
    # Generate ENCRYPTION_KEY
    if grep -q "change_this_encryption_key" .env; then
        ENCRYPTION_KEY=$(openssl rand -base64 32)
        sed -i.bak "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
        echo -e "${GREEN}✅ Generated ENCRYPTION_KEY${NC}"
    fi
    
    # Generate POSTGRES_PASSWORD
    if grep -q "change_this_secure_password" .env; then
        POSTGRES_PASSWORD=$(openssl rand -base64 24)
        sed -i.bak "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
        echo -e "${GREEN}✅ Generated POSTGRES_PASSWORD${NC}"
    fi
    
    # Generate REDIS_PASSWORD
    if grep -q "change_this_redis_password" .env; then
        REDIS_PASSWORD=$(openssl rand -base64 24)
        sed -i.bak "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
        echo -e "${GREEN}✅ Generated REDIS_PASSWORD${NC}"
    fi
    
    # Remove backup files
    rm -f .env.bak
    
    echo -e "${GREEN}✅ All secrets generated${NC}"
else
    echo -e "${GREEN}✅ Secrets are already configured${NC}"
fi

echo ""
echo "🐳 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting Linxio Task..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running${NC}"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo -e "${GREEN}🎉 Linxio Task is now running!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Check logs: docker-compose logs -f app"
    echo "  2. Access the application: http://localhost:3000"
    echo "  3. Create admin user: docker-compose exec app sh -c 'cd backend && npm run seed:admin'"
    echo ""
else
    echo -e "${RED}❌ Some services failed to start. Check logs with: docker-compose logs${NC}"
    exit 1
fi


