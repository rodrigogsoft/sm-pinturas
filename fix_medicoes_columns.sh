#!/bin/bash
echo "=== Fix tb_medicoes: colunas faltando ==="

FIX_SQL="
ALTER TABLE tb_medicoes ADD COLUMN IF NOT EXISTS area_planejada DECIMAL(10,2);
ALTER TABLE tb_medicoes ADD COLUMN IF NOT EXISTS valor_calculado DECIMAL(10,2);
ALTER TABLE tb_medicoes ADD COLUMN IF NOT EXISTS data_medicao DATE;
"

echo "$FIX_SQL" | docker exec -i sm_db psql -U sm_user -d sm_pinturas_prod
echo "--- PROD OK ---"
echo "$FIX_SQL" | docker exec -i sm_db psql -U sm_user -d sm_pinturas_homol
echo "--- HOMOL OK ---"
echo "=== Concluido ==="
