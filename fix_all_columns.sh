#!/bin/bash
DB1="sm_pinturas_prod"
DB2="sm_pinturas_homol"

run_sql() {
  local db=$1
  local sql=$2
  echo "$sql" | docker exec -i sm_db psql -U sm_user -d "$db" 2>&1
}

echo "=== Aplicando migrations nos dois bancos ==="

# tb_alocacoes_tarefa
run_sql $DB1 "ALTER TABLE tb_alocacoes_tarefa ADD COLUMN IF NOT EXISTS id_ambiente UUID;"
run_sql $DB1 "ALTER TABLE tb_alocacoes_tarefa ADD COLUMN IF NOT EXISTS observacoes TEXT;"
run_sql $DB1 "ALTER TABLE tb_alocacoes_tarefa ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT false;"
run_sql $DB2 "ALTER TABLE tb_alocacoes_tarefa ADD COLUMN IF NOT EXISTS id_ambiente UUID;"
run_sql $DB2 "ALTER TABLE tb_alocacoes_tarefa ADD COLUMN IF NOT EXISTS observacoes TEXT;"
run_sql $DB2 "ALTER TABLE tb_alocacoes_tarefa ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT false;"

# tb_tabela_precos
run_sql $DB1 "ALTER TABLE tb_tabela_precos ADD COLUMN IF NOT EXISTS observacoes TEXT;"
run_sql $DB1 "ALTER TABLE tb_tabela_precos ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT false;"
run_sql $DB2 "ALTER TABLE tb_tabela_precos ADD COLUMN IF NOT EXISTS observacoes TEXT;"
run_sql $DB2 "ALTER TABLE tb_tabela_precos ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT false;"

# tb_obras
run_sql $DB1 "ALTER TABLE tb_obras ADD COLUMN IF NOT EXISTS data_conclusao DATE;"
run_sql $DB1 "ALTER TABLE tb_obras ADD COLUMN IF NOT EXISTS deletado BOOLEAN NOT NULL DEFAULT false;"
run_sql $DB2 "ALTER TABLE tb_obras ADD COLUMN IF NOT EXISTS data_conclusao DATE;"
run_sql $DB2 "ALTER TABLE tb_obras ADD COLUMN IF NOT EXISTS deletado BOOLEAN NOT NULL DEFAULT false;"

# tb_ambientes
run_sql $DB1 "ALTER TABLE tb_ambientes ADD COLUMN IF NOT EXISTS area_m2 DECIMAL(10,2);"
run_sql $DB1 "ALTER TABLE tb_ambientes ADD COLUMN IF NOT EXISTS descricao TEXT;"
run_sql $DB2 "ALTER TABLE tb_ambientes ADD COLUMN IF NOT EXISTS area_m2 DECIMAL(10,2);"
run_sql $DB2 "ALTER TABLE tb_ambientes ADD COLUMN IF NOT EXISTS descricao TEXT;"

echo "=== Concluido ==="
