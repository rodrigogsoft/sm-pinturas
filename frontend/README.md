# Frontend - JB Pinturas

Aplicação React para o sistema de gestão de pintura

## Instalação

```bash
npm install
```

## Configuração

### 1. Criar arquivo .env

```bash
cp .env.example .env
```

### 2. Configurar variáveis

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

## Desenvolvimento

```bash
npm start
```

Abrirá em http://localhost:3000

## Build

```bash
npm run build
```

## Testes

```bash
npm test
```

## Estrutura

```
src/
├── components/       # Componentes React
├── pages/           # Páginas
├── services/        # Serviços de API
├── store/           # Redux store
├── hooks/           # Custom hooks
├── utils/           # Utilitários
└── App.tsx
```

## Documentação

Veja [../docs](../docs) para mais informações.
