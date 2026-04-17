# 📱 Setup - Mobile App React Native

## Pré-requisitos

- Node.js >= 18
- npm ou yarn
- React Native CLI: `npm install -g react-native-cli`
- Android Studio (para emular Android)
- Xcode (para emular iOS - apenas macOS)

## 1. Instalação Inicial

```bash
cd mobile
npm install
```

## 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Editar `.env`:
```
API_BASE_URL=http://localhost:3000/api/v1
ENV=development
```

Para dispositivos físicos, use o IP da máquina:
```
API_BASE_URL=http://192.168.1.100:3000/api/v1
```

## 3. Executar no Android

### Opção A: Emulador
```bash
npm run android
```

### Opção B: Dispositivo Real
```bash
# Conectar device via USB e ativar USB Debugging
npm run android
```

## 4. Executar no iOS

### Opção A: Simulador
```bash
npm run ios
```

### Opção B: Dispositivo Real
```bash
npm run ios -- --device
```

## 5. Usar Metro Bundler (Desenvolvimento)

```bash
npm start
```

Depois em outro terminal:
```bash
npm run android
# ou
npm run ios
```

## 🏗️ Estrutura do Projeto

```
src/
├── screens/          # Telas da aplicação
│   ├── LoginScreen.tsx
│   ├── ObrasScreen.tsx
│   ├── RDOFormScreen.tsx
│   └── RDOListScreen.tsx
├── navigation/       # Configuração de rotas
│   └── RootNavigator.tsx
├── store/           # Redux store
│   ├── slices/
│   │   ├── authSlice.ts
│   │   └── rdoSlice.ts
│   └── index.ts
├── services/        # Integração com API
│   └── api.ts
├── database/        # WatermelonDB
│   ├── schema.ts
│   └── index.ts
├── types/          # TypeScript types
│   └── index.ts
├── utils/          # Funções auxiliares
│   └── formatters.ts
├── hooks/          # Custom hooks
│   └── redux.ts
└── components/     # Componentes reutilizáveis (planejado)
```

## 🔧 Configurations

### React Native Config
Após instalar, linkar:
```bash
cd ios && pod install && cd ..
```

### WatermelonDB Setup
O banco local (SQLite) é criado automaticamente na primeira execução.

Localização:
- **Android**: `data/data/com.jbpinturas/databases/jb_pinturas_mobile.db`
- **iOS**: App Document Folder

## 🚀 Features Principales (Implementadas)

✅ **Autenticação**
- Login com JWT
- Persistência de sessão em AsyncStorage
- Logout automático em 401

✅ **Obras (Lista e Seleção)**
- Listagem de obras ativas
- Filtros por status
- Refresh manual

✅ **Formulário RDO**
- Captura de horas trabalhadas
- Cálculo automático de produtividade
- Materiais e observações
- Localização (GPS)
- Assinatura digital
- Fotos antes/depois (estrutura pronta)

✅ **Sincronização Offline-First**
- WatermelonDB para persistência local
- Redux para state management
- NetInfo para monitorar conectividade
- Sincronização automática quando online

✅ **Lista de RDOs**
- Visualização de RDOs salvos
- Status: Rascunho, Enviado, Sincronizado
- Ações: Editar, Visualizar
- Estatísticas de sincronização

## 📋 Próximas Etapas

### Curto Prazo (MVP)
1. Testar autenticação contra backend real
2. Implementar captura de fotos (camera/image-picker)
3. Testar sincronização offline
4. Publicar em testflight/internal testing

### Médio Prazo
1. Adicionar tela de Colaboradores
2. Implementar edição de RDO existente
3. Adicionar filtros e busca
4. Notificações push (Firebase Cloud Messaging)

### Longo Prazo
1. Relatórios em PDF
2. Mapas de localização
3. Integração com câmera para leitura de QR Code
4. Assinatura com PIN/biometria

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
cd ios && pod install && cd ..
```

### Metro Bundler não inicia
```bash
npx react-native start --reset-cache
```

### Porta 8081 já em uso
```bash
lsof -i :8081
kill -9 <PID>
```

### Permission errors no Android
```bash
npx react-native start --reset-cache
npm run android
```

## 📞 Contato & Suporte

Para issues e dúvidas sobre o setup, verifique:
1. Node.js version: `node --version` (deve ser >= 18)
2. React Native version: `react-native --version`
3. Logs do Metro Bundler
4. Android Studio / Xcode logs
