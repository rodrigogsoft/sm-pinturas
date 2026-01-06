# Mobile - JB Pinturas

Aplicativo React Native para Android

## Pré-requisitos

- Node.js 18+
- Android SDK
- Android Studio ou Emulator
- JDK 11+

## Instalação

```bash
npm install
```

## Configuração

### 1. Criar arquivo .env

```bash
cp .env.example .env
```

### 2. Iniciar Metro bundler

```bash
npm start
```

### 3. Em outro terminal, build para Android

```bash
npm run android
```

## Desenvolvimento

```bash
npm start
```

## Testes

```bash
npm test
```

## Build para Produção

### APK de Debug
```bash
npm run build:apk
```

### APK de Produção
```bash
npm run build:release
```

## Funcionalidades

- Funciona offline
- Sincroniza dados quando online
- Upload de fotos
- Notificações push
- Autenticação JWT

## Estrutura

```
src/
├── screens/      # Telas
├── components/   # Componentes
├── services/     # Serviços
├── store/        # Redux
├── hooks/        # Custom hooks
├── utils/        # Utilitários
├── navigation/   # Navegação
└── App.tsx
```

## Troubleshooting

### Metro bundler não inicia
```bash
npm start -- --reset-cache
```

### Emulator não aparece
```bash
adb devices
```

### Limpar build
```bash
cd android && ./gradlew clean && cd ..
npm start -- --reset-cache
```

Veja [../docs](../docs) para mais informações.
