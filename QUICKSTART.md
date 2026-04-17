# 🚀 Início Rápido - JB Pinturas ERP

Guia rápido para configurar o ambiente de desenvolvimento local em **menos de 10 minutos**.

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ [Node.js 18+](https://nodejs.org/)
- ✅ [Git](https://git-scm.com/)
- ✅ [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclui Docker Compose)

**Opcional (para desenvolvimento mobile):**
- Android Studio (Android)
- Xcode (iOS - macOS apenas)

---

## 📥 Passo 1: Clonar o Repositório

```bash
git clone https://github.com/jb-pinturas/erp-obras.git
cd jb_pinturas
```

---

## 🐳 Passo 2: Subir Banco de Dados e Serviços

```bash
# Subir PostgreSQL e Redis com Docker Compose
docker-compose up -d postgres redis

# Aguardar serviços ficarem prontos (30 segundos)
```

✅ **Serviços disponíveis:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Adminer (UI do banco): http://localhost:8080

**Login Adminer:**
- Sistema: PostgreSQL
- Servidor: postgres
- Usuário: jb_admin
- Senha: jb_secure_pass_2026
- Banco: jb_pinturas_db

---

## 🔧 Passo 3: Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Executar migrations do banco de dados
npm run migration:run

# (Opcional) Popular banco com dados de exemplo
npm run seed

# Iniciar servidor em modo desenvolvimento
npm run start:dev
```

✅ **Backend rodando em:** http://localhost:3000  
✅ **Swagger (Documentação API):** http://localhost:3000/api/docs

---

## 💻 Passo 4: Configurar Frontend

```bash
# Em outro terminal
cd ../frontend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

✅ **Frontend rodando em:** http://localhost:3001

---

## 📱 Passo 5: Configurar Mobile (Opcional)

### Android

```bash
# Em outro terminal
cd ../mobile

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Conectar device ou iniciar emulador Android
# Então execute:
npm run android
```

### iOS (macOS apenas)

```bash
cd mobile

# Instalar dependências
npm install

# Instalar pods
cd ios && pod install && cd ..

# Copiar variáveis de ambiente
cp .env.example .env

# Iniciar no simulator
npm run ios
```

---

## 🎉 Pronto! Agora você tem:

| Componente | URL | Descrição |
|------------|-----|-----------|
| 🌐 Frontend Web | http://localhost:3001 | Interface administrativa |
| 🔌 Backend API | http://localhost:3000 | API REST |
| 📚 Swagger Docs | http://localhost:3000/api/docs | Documentação interativa |
| 🗄️ Adminer | http://localhost:8080 | Interface do PostgreSQL |
| 📱 Mobile App | Emulador/Device | App React Native |

---

## 🧪 Testando a API

### 1. Via Swagger (Recomendado)

Acesse http://localhost:3000/api/docs e teste os endpoints diretamente.

### 2. Via cURL

```bash
# Health check
curl http://localhost:3000/health

# Login (quando implementado)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jbpinturas.com","password":"senha123"}'
```

### 3. Via Postman

Importe a collection disponível em `docs/postman/JB-Pinturas.postman_collection.json`

---

## 📊 Estrutura de Pastas

```
jb_pinturas/
├── backend/          # API NestJS (Port 3000)
│   ├── src/
│   │   ├── modules/  # Módulos funcionais
│   │   ├── common/   # Código compartilhado
│   │   └── config/   # Configurações
│   └── database/     # Migrations e seeds
│
├── frontend/         # Web React (Port 3001)
│   ├── src/
│   │   ├── pages/    # Telas
│   │   ├── components/ # Componentes
│   │   └── store/    # Redux
│   └── public/
│
├── mobile/           # React Native
│   ├── src/
│   │   ├── screens/  # Telas
│   │   ├── components/
│   │   └── database/ # WatermelonDB
│   ├── android/
│   └── ios/
│
└── docs/             # Documentação
```

---

## 🔍 Próximos Passos

### Para Desenvolvedores Backend

1. Criar um novo módulo:
   ```bash
   cd backend
   nest g module meu-modulo
   nest g service meu-modulo
   nest g controller meu-modulo
   ```

2. Ler: [docs/ERS-v4.0.md](docs/ERS-v4.0.md)
3. Ler: [docs/database-schema.md](docs/database-schema.md)

### Para Desenvolvedores Frontend

1. Criar uma nova página em `frontend/src/pages/`
2. Adicionar rota em `frontend/src/App.tsx`
3. Estudar Design System em `frontend/src/theme.ts`

### Para Desenvolvedores Mobile

1. Configurar WatermelonDB
2. Implementar sincronização offline
3. Testar em dispositivos reais

---

## 🐛 Problemas Comuns

### Backend não inicia

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Verificar logs
docker-compose logs postgres

# Recriar containers
docker-compose down
docker-compose up -d postgres redis
```

### Frontend não conecta com a API

1. Verificar `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

2. Verificar CORS no backend (`backend/src/main.ts`)

### Porta já está em uso

```bash
# Linux/Mac - Liberar porta 3000
sudo lsof -ti:3000 | xargs kill -9

# Windows - Liberar porta 3000
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

---

## 📚 Documentação Completa

- [ERS v4.0 - Especificação de Requisitos](docs/ERS-v4.0.md)
- [Database Schema](docs/database-schema.md)
- [Guia de Deploy](docs/DEPLOY.md)
- [Guia de Contribuição](docs/CONTRIBUTING.md)

---

## 💬 Ajuda

- **Issues**: https://github.com/jb-pinturas/erp-obras/issues
- **Email**: dev@jbpinturas.com.br
- **Slack**: #jb-pinturas-dev

---

## 🎯 Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] Docker Desktop instalado e rodando
- [ ] Repositório clonado
- [ ] PostgreSQL e Redis rodando (Docker)
- [ ] Backend iniciado com sucesso
- [ ] Frontend iniciado com sucesso
- [ ] Swagger acessível
- [ ] Adminer acessível
- [ ] (Opcional) Mobile rodando no emulador

---

**Dica:** Mantenha 3 terminais abertos:
1. Backend (`npm run start:dev`)
2. Frontend (`npm run dev`)
3. Comandos avulsos (git, docker, etc.)

**Boa codificação! 🚀**
