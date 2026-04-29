#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3007/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"adm.homol@conecti.tec.br","password":"kmzway87aa"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token",""))')

echo "Token chars: ${#TOKEN}"
STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  'http://localhost:3007/api/v1/notificacoes/minhas/paginado?lida=false&page=1&limit=50' \
  -H "Authorization: Bearer $TOKEN")
echo "notificacoes/minhas/paginado => $STATUS"
