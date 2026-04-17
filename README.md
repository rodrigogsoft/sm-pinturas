# ERP de Gestão de Obras - JB Pinturas

[![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow)]()
[![Versão ERS](https://img.shields.io/badge/ERS-v4.0-blue)]()

## 📋 Sobre o Projeto

Sistema ERP completo para gestão de obras de pintura, desenvolvido para digitalizar e otimizar todos os processos operacionais e financeiros da JB Pinturas.

### Status de Implementação

#### ✅ Backend (100% Completo)
- ✅ **Módulos Core**: Auth, Usuários, Obras, Clientes, Colaboradores, Serviços, Preços
- ✅ **Módulos Avançados**: Alocações, Medições, Financeiro, Auditoria, Notificações
- ✅ **Regras de Negócio**: RN02 (Bloqueio 1:1), RF04 (Aprovação Margem), RF08 (Uploads)
- ✅ **Relatórios**: Dashboard Financeiro, Medições, Produtividade, Margem Lucro
- ✅ **Testes**: 58 testes E2E passing (100% cobertura crítica)
- ✅ **Documentação**: Swagger OpenAPI completo
- ✅ **Deploy**: Docker Compose multi-ambiente + CI/CD GitHub Actions

#### 🔄 Frontend Web (Em Progresso - 75%)
- ✅ **Autenticação**: Login com API + JWT + Redux
- ✅ **Dashboard**: KPIs em tempo real + Filtros + Detalhes por Obra
- ✅ **Infraestrutura**: API Service Layer + Interceptors + Error Handling
- ✅ **CRUD Obras**: Listagem + Criação + Edição + Exclusão com DataGrid
- ✅ **CRUD Clientes**: Listagem + Criação + Edição + Exclusão com DataGrid
- ✅ **CRUD Colaboradores**: Listagem + Criação + Edição + Exclusão com DataGrid
- ⏳ **CRUD Serviços**: Próximo
- ⏳ **Relatórios**: Páginas de relatórios detalhados
- ⏳ **Auditoria**: Visualização de logs

#### ⏳ Mobile (Planejado)
- ⏳ RDO Digital Offline-First
- ⏳ Geolocalização e Foto Upload
- ⏳ Assinatura Digital
- ⏳ Sincronização Bidirecional

### Principais Funcionalidades

- ✅ **Gestão de Obras**: Estrutura hierárquica (Obra > Pavimento > Ambiente)
- 💰 **Controle Financeiro**: Precificação dual (Custo/Venda) com aprovação de margens
- 📱 **App Mobile Offline-First**: RDO digital com geolocalização e assinatura
- 👥 **Gestão de Recursos**: Alocação inteligente de colaboradores (1:1)
- 📊 **Dashboards**: Visão em tempo real de lucratividade
- 🔐 **Segurança**: RBAC, criptografia AES-256, MFA para perfis críticos

---

## 🎯 PLANO DE IMPLEMENTAÇÃO ERS 4.0

**Status Atual:** 70% Implementado → **Meta:** 100% (8 semanas)

### 📚 Documentação Completa do Plano

1. **⚡ [QUICK_START.md](QUICK_START.md)** - Comece aqui! (5 min)
	- Setup inicial para novos devs
	- Checklist de primeiro dia
	- Problemas comuns resolvidos

2. **📖 [README_PLANO.md](README_PLANO.md)** - Guia completo (10 min)
	- Índice de todos os documentos
	- Como navegar pela documentação
	- Estrutura do plano

3. **📊 [COMPARATIVO_ERS_4.0_IMPLEMENTACAO.md](COMPARATIVO_ERS_4.0_IMPLEMENTACAO.md)** - Análise detalhada
	- O que foi implementado vs. especificação
	- 10 gaps críticos identificados
	- Priorização (P0, P1, P2)

4. **🎯 [PLANO_ACAO_ERS_4.0.md](PLANO_ACAO_ERS_4.0.md)** - Plano técnico completo
	- 4 sprints detalhadas (8 semanas)
	- Código de exemplo para cada feature
	- Migrations SQL, comandos, DoD

5. **✅ [CHECKLIST_IMPLEMENTACAO.md](CHECKLIST_IMPLEMENTACAO.md)** - Rastreamento diário
	- Checklist executável (marcar progresso)
	- Organizado por Sprint e área
	- Atualizar diariamente

6. **📄 [RESUMO_EXECUTIVO_PLANO.md](RESUMO_EXECUTIVO_PLANO.md)** - Para stakeholders
	- Documento de 1 página
	- Cronograma, investimento, ROI
	- Aprovação executiva

### 🚀 Próximas Entregas (Prioridade P0)

| Sprint | Período | Entregas Principais | Status |
|--------|---------|---------------------|--------|
| **Sprint 1** | 10-21 Fev | RF04 (Workflow Preços), RF10 (Alertas) | 📅 Agendado |
| **Sprint 2** | 24 Fev-7 Mar | RF06 (RDO Digital GPS), RF08 (Excedentes UI) | 📅 Agendado |
| **Sprint 3** | 9-20 Mar | RF07 (Alocação Visual), RF09 (Push) | 📅 Agendado |
| **Sprint 4** | 21 Mar-3 Abr | Performance, Jobs, Testes E2E | 📅 Agendado |

**🎉 Release 1.0 em Produção:** 03 de Abril de 2026

### 📦 Recursos de Suporte

- **🔧 [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)** - Guia de variáveis de ambiente
- **📝 [TEMPLATE_ISSUE.md](TEMPLATE_ISSUE.md)** - Template para criar tasks
- **📖 [docs/ERS-v4.0.md](docs/ERS-v4.0.md)** - Especificação oficial (fonte da verdade)

---

## 🏗️ Arquitetura

```
jb_pinturas/
├── backend/          # API NestJS + PostgreSQL
├── frontend/         # Painel Web React + Material UI
├── mobile/           # App React Native + WatermelonDB
├── docs/             # Documentação técnica
└── infra/            # Scripts de deploy e CI/CD
```

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: NestJS (Node.js/TypeScript)
- **Banco de Dados**: PostgreSQL 15+
- **Autenticação**: JWT + MFA (Google Auth/Authy)
- **Cache**: Redis
- **Jobs**: BullMQ
- **Storage**: AWS S3

### Frontend Web
- **Framework**: React.js 18+
- **UI Library**: Material UI v5
- **State Management**: Redux Toolkit
- **Charts**: Recharts

### Mobile
- **Framework**: React Native
- **Database Local**: WatermelonDB
- **Sync**: Custom Offline-First Strategy
- **Maps**: React Native Maps

## 👥 Perfis de Usuário (RBAC)

| Perfil | Descrição |
|--------|-----------|
| **Administrador** | Gestão do sistema, usuários e auditoria |
| **Gestor** | Aprovação de preços e validação de medições |
| **Financeiro** | Cadastro de clientes, preços e pagamentos |
| **Encarregado** | Operação de campo (cego financeiramente) |
| **Colaborador** | Entidade passiva para alocação |

## 🚀 Como Começar

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

### Instalação

```bash
# Clone o repositório
git clone https://github.com/jb-pinturas/erp-obras.git
cd jb_pinturas

# Instale as dependências do backend
cd backend
npm install

# Instale as dependências do frontend
cd ../frontend
npm install

# Instale as dependências do mobile
cd ../mobile
npm install
```

### Configuração

```bash
# Configure as variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mobile/.env.example mobile/.env

# Edite os arquivos .env com suas credenciais
```

### Executar com Docker

```bash
# Subir toda a stack
docker-compose up -d

# Acessar:
# - API: http://localhost:3000
# - Web: http://localhost:3001
# - Adminer (DB): http://localhost:8080
```

### Executar em Desenvolvimento

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev
# API disponível em http://localhost:3000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Web disponível em http://localhost:5173

# Terminal 3 - Mobile (opcional)
cd mobile
npm run android # ou npm run ios
```

### 🎯 Guias de Setup Rápido

- **[Frontend Dashboard Setup](SETUP_FRONTEND.md)** - Guia completo para testar login e dashboard
- **[Deploy Setup](SETUP_DEPLOY.md)** - Configuração de ambientes e deploy

### 🔑 Credenciais de Teste (Seed Data)

```
Email: admin@example.com
Senha: senha123
```

## 📚 Documentação

- [Especificação de Requisitos (ERS v4.0)](docs/ERS-v4.0.md)
- [Arquitetura de Banco de Dados](docs/database-schema.md)
- [Guia de Contribuição](docs/CONTRIBUTING.md)
- [API Reference](docs/api/README.md)

## 🔒 Segurança

- Criptografia AES-256 para dados sensíveis
- TLS 1.2+ obrigatório
- MFA para perfis Financeiro e Gestor
- Auditoria completa de ações (logs imutáveis)
- Soft Delete para integridade histórica

## 📊 Estrutura do Banco de Dados

### Domínios Principais

1. **Identidade e Segurança (IAM)**: `tb_perfis`, `tb_usuarios`
2. **Estrutura de Obra**: `tb_obras`, `tb_pavimentos`, `tb_ambientes`
3. **Financeiro**: `tb_clientes`, `tb_catalogo_servicos`, `tb_tabela_precos`
4. **Operação**: `tb_colaboradores`, `tb_sessoes_diarias`, `tb_alocacoes_tarefa`, `tb_medicoes`
5. **Auditoria**: `tb_audit_logs`

## 🧪 Testes

```bash
# Backend - Testes unitários
cd backend
npm run test

# Backend - Testes E2E
npm run test:e2e

# Frontend - Testes
cd ../frontend
npm test

# Mobile - Testes
cd ../mobile
npm test
```

## 📱 Build de Produção

### Web
```bash
cd frontend
npm run build
# Output em: frontend/build
```

### Mobile
```bash
cd mobile

# Android
npm run android:release

# iOS
npm run ios:release
```

## 🤝 Contribuindo

Leia nosso [Guia de Contribuição](docs/CONTRIBUTING.md) para saber como colaborar com o projeto.

## 📄 Licença

Proprietary - © 2026 JB Pinturas. Todos os direitos reservados.

## 👨‍💻 Equipe

- **Product Owner**: JB Pinturas
- **Tech Lead**: [Nome]
- **Backend**: [Nome]
- **Frontend**: [Nome]
- **Mobile**: [Nome]

## 📞 Suporte

Para questões técnicas ou suporte, entre em contato:
- Email: suporte@jbpinturas.com.br
- Issues: [GitHub Issues]

---

**Versão**: 1.0.0  
**Última Atualização**: Fevereiro 2026
