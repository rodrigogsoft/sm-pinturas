#!/bin/bash
# =============================================================
# Script: init-multiple-dbs.sh
# Cria os databases de produção e homologação no PostgreSQL
# Executado automaticamente na primeira inicialização do container
# =============================================================

set -e

function create_db() {
    local db=$1
    echo "Criando banco: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE "$db" ENCODING 'UTF8' LC_COLLATE 'C.UTF-8' LC_CTYPE 'C.UTF-8' TEMPLATE template0;
        GRANT ALL PRIVILEGES ON DATABASE "$db" TO "$POSTGRES_USER";
EOSQL
}

create_db "sm_pinturas_prod"
create_db "sm_pinturas_homol"

echo "Bancos criados com sucesso."
