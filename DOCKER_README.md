# JB Pinturas — Execução local com Docker

> Instruções rápidas para subir o ambiente de desenvolvimento local usando Docker Compose.

Pré-requisitos
- Docker e Docker Compose instalados (Windows: Docker Desktop).
- Ports livres: 3001, 3000, 5433, 6379, 8080, 5050 (ajustáveis via .env)

Subir todo o ambiente (build + containers)

```powershell
cd <path/to/repo>/jb_pinturas
docker compose up -d --build
```

Observações importantes
- O build do `frontend` pode falhar se `public/index.html` ou assets necessários estiverem ausentes. Neste repositório o `frontend` não contém `public/index.html`, por isso o build foi evitado em execuções parciais. Para construir o frontend localmente:

```powershell
cd frontend
npm install
npm run build
```

- O mapeamento do Postgres foi alterado para `5433:5432` para evitar conflito com uma instância local já existente. Se quiser mapear para `5432`, ajuste `docker-compose.yml` e a variável `DATABASE_PORT`.

Serviços principais
- Backend API: http://localhost:3001 (container: `jb_pinturas_api`)
- Postgres: host localhost:5433 (container: `jb_pinturas_db`)
- Redis: localhost:6379 (container: `jb_pinturas_cache`)
- Adminer: http://localhost:8080
- pgAdmin: http://localhost:5050

Comandos úteis
- Ver status dos containers:

```powershell
docker ps --filter "name=jb_pinturas"
```

- Logs do backend:

```powershell
docker compose logs -f api
```

- Executar testes dentro do container backend:

```powershell
docker exec -it jb_pinturas_api npm test
```

- Parar e remover containers e volumes:

```powershell
docker compose down -v
```

Notas sobre CI / commit
- O commit local atual inclui `node_modules`. Recomendo remover `node_modules` do histórico e adicionar um `.gitignore` antes de fazer push para o remoto.

Próximos passos sugeridos
- Corrigir o `frontend` (adicionar `public/index.html` ou ajustar Dockerfile) se quiser servir a aplicação inteira via `docker compose up`.
- Rodar testes de integração (integração) com banco em memória ou configuração adequada.

Arquivo relacionado: `docker-compose.yml`

---
Gerado em: 06/01/2026
