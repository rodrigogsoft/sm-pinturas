#!/usr/bin/env bash
# ============================================================
# JB PINTURAS - Phase 1 Quickstart Script
# ============================================================

echo "🚀 JB PINTURAS - Phase 1 Setup"
echo "=============================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}❌ Erro: Este script deve ser executado no diretório raiz do projeto${NC}"
    exit 1
fi

echo -e "${BLUE}1. Iniciando Docker Compose...${NC}"
docker-compose up -d

# Aguardar 10 segundos para os serviços iniciarem
echo -e "${BLUE}2. Aguardando serviços iniciarem (10s)...${NC}"
sleep 10

echo -e "${BLUE}3. Verificando status dos serviços...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Serviços iniciados!${NC}"
echo ""
echo "📍 Acessos Disponíveis:"
echo "   - API Backend: http://localhost:3001"
echo "   - Swagger Docs: http://localhost:3001/api/docs"
echo "   - Health Check: http://localhost:3001/health"
echo "   - Frontend: http://localhost:3000 (em breve)"
echo "   - pgAdmin: http://localhost:5050"
echo ""
echo "🔐 Credenciais Padrão:"
echo "   - Email: admin@jbpinturas.com"
echo "   - Senha: admin123"
echo ""
echo -e "${YELLOW}📚 Próximos Passos:${NC}"
echo "   1. Leia: PHASE1_SPRINT1_COMPLETA.md"
echo "   2. Teste: POSTMAN_GUIDE.md"
echo "   3. Documentação: docs/API.md"
echo ""
echo -e "${GREEN}🎉 Sistema pronto para usar!${NC}"
