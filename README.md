# Sistema de Gestão de Pintura - JB Pinturas

[![E2E CI](https://github.com/<owner>/<repo>/actions/workflows/e2e-ci.yml/badge.svg?branch=main)](https://github.com/<owner>/<repo>/actions/workflows/e2e-ci.yml)
[![Backend Unit Tests](https://github.com/<owner>/<repo>/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/<owner>/<repo>/actions/workflows/backend-ci.yml)


## 📋 Visão Geral

Sistema completo e escalável para gerenciar operações de pintura, incluindo:
- Gestão de obras e clientes
- Gerenciamento de colaboradores e pagamentos
- Controle de medições e serviços
- Gestão financeira e relatórios
- Sistema de notificações e pendências
- Funcionalidade offline para mobile

## 🏗️ Arquitetura do Sistema

```
jb_pinturas/
├── backend/                 # API REST (NestJS + Node.js)
├── frontend/               # Web (React + Material UI)
├── mobile/                 # Android (React Native)
├── docs/                   # Documentação
├── infrastructure/         # Docker, Kubernetes, CI/CD
└── README.md
```

## 🛠️ Stack Tecnológico

### Frontend
- **Web**: React 18+, TypeScript, Material UI
- **Mobile**: React Native, AsyncStorage (offline)
- **State Management**: Redux ou Context API
- **API Client**: Axios + Interceptors para JWT

### Backend
- **Runtime**: Node.js 18+
- **Framework**: NestJS
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM ou Prisma
- **Autenticação**: JWT + BCrypt
- **Cache**: Redis (opcional)
- **File Storage**: AWS S3 ou MinIO

### Infraestrutura
- **Containerização**: Docker
- **Orquestração**: Kubernetes
- **CI/CD**: GitHub Actions / GitLab CI
- **Cloud**: AWS / Google Cloud
- **Logging**: Winston / ELK Stack

## 👥 Perfis de Usuário

1. **Administrador**: Acesso total, gerenciamento de permissões
2. **Gestor**: Aprovação de medições, gestão geral
3. **Financeiro**: Gestão de cobranças e pagamentos
4. **Encarregado**: Gestão de colaboradores e serviços

## 📱 Funcionalidades Principais

### Cadastros
- [ ] Usuários com autenticação JWT
- [ ] Clientes (PJ/PF)
- [ ] Obras com relacionamento a clientes
- [ ] Colaboradores com dados bancários
- [ ] Tipos de serviço com unidades de medida

### Operações
- [ ] Alocação de colaboradores em obras
- [ ] Registro de serviços realizados
- [ ] Upload de fotos de conclusão
- [ ] Medição de serviços
- [ ] Controle de pagamentos

### Gestão Financeira
- [ ] Cálculo de pagamentos aos colaboradores
- [ ] Alertas de valor teto excedido
- [ ] Gestão de cobranças aos clientes
- [ ] Comprovantes de pagamento
- [ ] Auditoria de transações

### Notificações
- [ ] Alertas de medições pendentes
- [ ] Notificações de cobranças
- [ ] Aprovações necessárias
- [ ] Sistema de pendências

### Relatórios
- [ ] Produção e progresso de obras
- [ ] Pagamento aos colaboradores
- [ ] Produtividade e eficiência
- [ ] Análise de custos
- [ ] Desempenho por cliente
- [ ] Dashboards em tempo real

## 🔒 Segurança

- Autenticação JWT
- Controle de acesso baseado em perfis (RBAC)
- Criptografia de dados sensíveis
- Auditoria completa de ações
- Conformidade com LGPD
- HTTPS obrigatório

## 🚀 Getting Started

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Mobile
```bash
cd mobile
npm install
npm run android
```

## 📚 Documentação

- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [Guia de Instalação](docs/INSTALLATION.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Contributing](docs/CONTRIBUTING.md)

## 📝 Requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose
- Android SDK (para mobile)

## 📄 Licença

Proprietário - JB Pinturas

## 👨‍💻 Equipe

Desenvolvido para: JB Pinturas
Data: Janeiro de 2026
