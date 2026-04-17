#!/bin/bash

# ============================================
# Script de Inicialização - JB Pinturas ERP
# ============================================

set -e

echo "🎨 JB Pinturas ERP - Inicialização"
echo "=================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${YELLOW}1. Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 18+ primeiro.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
echo ""

# Verificar PostgreSQL  
echo -e "${YELLOW}2. Verificando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}⚠️  PostgreSQL não encontrado localmente.${NC}"
    echo "   Use Docker: docker-compose up -d postgres"
else
    PG_VERSION=$(psql --version)
    echo -e "${GREEN}✅ $PG_VERSION${NC}"
fi
echo ""

# Verificar Redis
echo -e "${YELLOW}3. Verificando Redis...${NC}"
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}⚠️  Redis não encontrado localmente.${NC}"
    echo "   Use Docker: docker-compose up -d redis"
else
    REDIS_VERSION=$(redis-cli --version)
    echo -e "${GREEN}✅ $REDIS_VERSION${NC}"
fi
echo ""

# Instalar dependências do backend
echo -e "${YELLOW}4. Instalando dependências do backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
else
    echo -e "${GREEN}✅ Dependências já instaladas${NC}"
fi
cd ..
echo ""

# Configurar .env
echo -e "${YELLOW}5. Configurando variáveis de ambiente...${NC}"
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Arquivo .env criado. CONFIGURE-O antes de continuar!${NC}"
    echo "   Abra backend/.env e preencha:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET (32+ caracteres)"
    echo "   - JWT_REFRESH_SECRET (32+ caracteres)"
    echo ""
    read -p "Pressione ENTER quando terminar de configurar o .env..."
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi
echo ""

# Verificar banco de dados
echo -e "${YELLOW}6. Configurando banco de dados...${NC}"

# Extrair credenciais do .env
DB_HOST=$(grep DB_HOST backend/.env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT backend/.env | cut -d '=' -f2)
DB_USERNAME=$(grep DB_USERNAME backend/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD backend/.env | cut -d '=' -f2)
DB_DATABASE=$(grep DB_DATABASE backend/.env | cut -d '=' -f2)

echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_DATABASE"
echo ""

# Tentar conectar ao PostgreSQL
echo "   Testando conexão..."
export PGPASSWORD=$DB_PASSWORD

if psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅ Conexão com PostgreSQL estabelecida${NC}"
    
    # Verificar se banco existe
    DB_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_DATABASE'")
    
    if [ "$DB_EXISTS" != "1" ]; then
        echo "   Criando banco de dados $DB_DATABASE..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "CREATE DATABASE $DB_DATABASE"
        echo -e "${GREEN}✅ Banco de dados criado${NC}"
    else
        echo -e "${GREEN}✅ Banco de dados já existe${NC}"
    fi
    
    # Executar migrations
    echo "   Executando migrations..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f backend/database/migrations/001_create_tables.sql > /dev/null
    echo -e "${GREEN}✅ Migrations executadas${NC}"
    
    # Executar seeds
    echo "   Inserindo dados iniciais..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f backend/database/seeds/001_initial_data.sql > /dev/null
    echo -e "${GREEN}✅ Seeds executados${NC}"
    
else
    echo -e "${RED}❌ Não foi possível conectar ao PostgreSQL${NC}"
    echo "   Verifique se o PostgreSQL está rodando:"
    echo "   - Docker: docker-compose up -d postgres"
    echo "   - Local: sudo systemctl start postgresql"
    exit 1
fi
echo ""

# Compilar backend
echo -e "${YELLOW}7. Compilando backend...${NC}"
cd backend
npm run build
echo -e "${GREEN}✅ Backend compilado${NC}"
cd ..
echo ""

# Instalar frontend (opcional)
read -p "Deseja instalar o frontend também? (s/N): " INSTALL_FRONTEND
if [[ $INSTALL_FRONTEND =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}8. Instalando dependências do frontend...${NC}"
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
        echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"
    else
        echo -e "${GREEN}✅ Dependências do frontend já instaladas${NC}"
    fi
    
    # Configurar .env do frontend
    if [ ! -f ".env" ]; then
        cat > .env << EOF
VITE_API_URL=http://localhost:3000/api
VITE_API_VERSION=v1
VITE_APP_NAME=JB Pinturas ERP
EOF
        echo -e "${GREEN}✅ Arquivo .env do frontend criado${NC}"
    fi
    cd ..
    echo ""
fi

# Resumo
echo ""
echo "=================================="
echo -e "${GREEN}✅ Inicialização concluída!${NC}"
echo "=================================="
echo ""
echo "📝 Credenciais iniciais:"
echo "   Email: admin@jbpinturas.com.br"
echo "   Senha: Admin@2026"
echo ""
echo "🚀 Para iniciar o sistema:"
echo ""
echo "   Backend:"
echo "   cd backend && npm run start:dev"
echo "   Acesse: http://localhost:3000/api"
echo "   Swagger: http://localhost:3000/api/docs"
echo ""
if [[ $INSTALL_FRONTEND =~ ^[Ss]$ ]]; then
    echo "   Frontend:"
    echo "   cd frontend && npm run dev"
    echo "   Acesse: http://localhost:5173"
    echo ""
fi
echo "   Ou use Docker Compose:"
echo "   docker-compose up -d"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Altere a senha do admin após o primeiro login!${NC}"
echo ""
