#!/bin/bash
PORT=${1:-3006}
EMAIL=${2:-adm@conecti.tec.br}
SENHA=${3:-Admin@2026}

TOKEN=$(curl -s -X POST http://localhost:${PORT}/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${SENHA}\"}" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token",""))')

echo "Token chars: ${#TOKEN}"

for path in "obras" "precos" "relatorios/dashboard-financeiro?periodo=mes" "relatorios/medicoes?page=1&limit=10&periodo=mes" "relatorios/margem-lucro?periodo=mes&page=1&limit=10"; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/api/v1/${path}" -H "Authorization: Bearer $TOKEN")
  echo "$path => $STATUS"
done
