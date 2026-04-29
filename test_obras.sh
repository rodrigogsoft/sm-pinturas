#!/bin/bash
RESP=$(curl -s -X POST http://localhost:3007/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"adm.homol@conecti.tec.br","password":"kmzway87aa"}')
echo "Login resp: $RESP" | head -c 200
TOKEN=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token",""))')
echo ""
echo "Token chars: ${#TOKEN}"
STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3007/api/v1/obras -H "Authorization: Bearer $TOKEN")
echo "Obras status: $STATUS"
