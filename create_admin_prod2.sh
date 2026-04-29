#!/bin/bash
HASH=$(python3 -c "import bcrypt; h=bcrypt.hashpw(b'Admin@2026', bcrypt.gensalt(12)); print(h.decode())")
echo "Hash: $HASH"

SQL="INSERT INTO tb_usuarios (id, nome_completo, email, senha_hash, id_perfil, ativo, deletado, created_at, updated_at)
VALUES (gen_random_uuid(), 'Administrador', 'adm@conecti.tec.br', '${HASH}', 1, true, false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, ativo = true, deletado = false;"

echo "$SQL" | docker exec -i sm_db psql -U sm_user -d sm_pinturas_prod
echo "Concluido"
