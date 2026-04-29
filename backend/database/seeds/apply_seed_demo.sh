#!/usr/bin/env bash
# ================================================================
# APLICAR SEED DE DEMONSTRAÇÃO — JB Pinturas ERP
# ================================================================
# Uso:
#   ./apply_seed_demo.sh                          # usa .env do backend
#   DB_URL="postgres://..." ./apply_seed_demo.sh  # URL explícita
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="$SCRIPT_DIR/005_seed_demo_completo.sql"
ENV_FILE="$SCRIPT_DIR/../../.env"

# --- Carregar variáveis do .env se disponível
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(DB_HOST|DB_PORT|DB_USERNAME|DB_PASSWORD|DB_DATABASE)=' "$ENV_FILE" | xargs)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USERNAME:-postgres}"
DB_PASS="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_DATABASE:-jbpinturas}"

if [ -n "$DB_URL" ]; then
  echo "📦 Usando DB_URL fornecida..."
  PSQL_CMD="psql $DB_URL"
else
  echo "📦 Conectando em $DB_HOST:$DB_PORT/$DB_NAME como $DB_USER..."
  PSQL_CMD="PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
fi

echo ""
echo "🚀 Aplicando seed: 005_seed_demo_completo.sql"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
eval "$PSQL_CMD -f $SEED_FILE"

echo ""
echo "✅ Seed aplicado com sucesso!"
echo ""
echo "Usuários demo (email / senha):"
echo "  admin.demo@jbpinturas.com.br   / Admin@2026  (ADMIN)"
echo "  gestor.demo@jbpinturas.com.br  / Admin@2026  (GESTOR)"
echo "  financ.demo@jbpinturas.com.br  / Admin@2026  (FINANCEIRO)"
echo "  enc1.demo@jbpinturas.com.br    / Admin@2026  (ENCARREGADO)"
echo "  enc2.demo@jbpinturas.com.br    / Admin@2026  (ENCARREGADO)"
