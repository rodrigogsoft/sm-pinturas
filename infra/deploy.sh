#!/bin/bash
# =============================================================
# Script: deploy.sh
# Deploy da SM Pinturas & Construções na VPS
#
# Uso:
#   ./deploy.sh producao    → deploy apenas em produção
#   ./deploy.sh homol       → deploy apenas em homologação
#   ./deploy.sh ambos       → deploy nos dois ambientes
#
# Pré-requisitos na VPS:
#   - Docker + Docker Compose v2 instalados
#   - Arquivo .env na raiz com: DB_USER, DB_PASSWORD, REDIS_PASSWORD
#   - Nginx instalado + Certbot para SSL
# =============================================================

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"
LOG_FILE="$REPO_DIR/deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ─── Cores para output ───
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[AVISO]${NC} $1" | tee -a "$LOG_FILE"; }
erro() { echo -e "${RED}[ERRO]${NC} $1" | tee -a "$LOG_FILE"; exit 1; }

echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "Deploy iniciado em: $TIMESTAMP" >> "$LOG_FILE"
echo "Ambiente: ${1:-nenhum}" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# ─── Validações iniciais ───
[[ $# -eq 0 ]] && erro "Informe o ambiente: producao | homol | ambos"
[[ ! -f "$COMPOSE_FILE" ]] && erro "Arquivo $COMPOSE_FILE não encontrado"
[[ ! -f "$REPO_DIR/.env" ]] && erro "Arquivo .env não encontrado na raiz do projeto"

AMBIENTE="${1}"

deploy_ambiente() {
    local profile="$1"
    log "Iniciando deploy do ambiente: $profile"

    log "Fazendo pull das últimas alterações..."
    git -C "$REPO_DIR" pull origin master

    log "Construindo imagens Docker ($profile)..."
    docker compose -f "$COMPOSE_FILE" --profile "$profile" build --no-cache

    log "Parando containers antigos ($profile)..."
    docker compose -f "$COMPOSE_FILE" --profile "$profile" down --remove-orphans || true

    log "Subindo containers ($profile)..."
    docker compose -f "$COMPOSE_FILE" --profile "$profile" up -d

    log "Aguardando containers ficarem saudáveis..."
    sleep 10

    # Verificar se os containers subiram
    if docker compose -f "$COMPOSE_FILE" --profile "$profile" ps | grep -q "unhealthy\|Exit"; then
        erro "Alguns containers falharam ao iniciar. Verifique com: docker compose -f docker-compose.prod.yml logs"
    fi

    # Executar migrations automaticamente
    if [[ "$profile" == "producao" ]]; then
        local container="sm_api_prod"
    else
        local container="sm_api_homol"
    fi

    log "Executando migrations no banco ($profile)..."
    docker exec "$container" npm run migration:run || warn "Falha nas migrations — verifique manualmente"

    log "Limpando imagens antigas..."
    docker image prune -f --filter "until=24h" || true

    log "Deploy de $profile concluído com sucesso!"
}

# ─── Executar deploy conforme ambiente ───
case "$AMBIENTE" in
    producao)
        deploy_ambiente "producao"
        ;;
    homol)
        deploy_ambiente "homol"
        ;;
    ambos)
        deploy_ambiente "homol"
        deploy_ambiente "producao"
        ;;
    *)
        erro "Ambiente inválido: '$AMBIENTE'. Use: producao | homol | ambos"
        ;;
esac

# ─── Recarregar Nginx ───
log "Recarregando Nginx..."
if command -v nginx &>/dev/null; then
    sudo nginx -t && sudo systemctl reload nginx
    log "Nginx recarregado."
else
    warn "Nginx não encontrado — recarregue manualmente se necessário."
fi

echo ""
log "======================================================"
log " Deploy finalizado: $TIMESTAMP"
log " Produção:    https://app.smpinturas.com.br"
log " Homologação: https://homol.smpinturas.com.br"
log "======================================================"
