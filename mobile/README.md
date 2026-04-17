# JB Pinturas - Mobile App (React Native)

## 📱 Sobre

App mobile offline-first para encarregados de obra registrarem RDOs digitais, alocarem tarefas e medirem produção no campo.

## 🎯 Funcionalidades Principais

- ✅ **100% Offline**: Funciona sem internet
- 📍 **Geolocalização**: Registro automático de localização
- ✍️ **Assinatura Digital**: Coleta de assinatura do responsável
- 📸 **Fotos de Evidência**: Captura e compressão automática
- 🔄 **Sincronização Automática**: Delta sync inteligente
- 🚫 **Regra 1:1**: Impede alocação duplicada em ambientes

## 🛠️ Stack Tecnológico

- **Framework**: React Native 0.73
- **Database Local**: WatermelonDB (SQLite)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **UI Library**: React Native Paper
- **Offline Sync**: Custom Strategy

## 📋 Pré-requisitos

### Geral
- Node.js 18+
- Git
- Watchman (macOS)

### Android
- Android Studio
- JDK 17
- Android SDK (API 33+)

### iOS (macOS apenas)
- Xcode 15+
- CocoaPods
- Ruby 2.7+

## 🚀 Instalação

### 1. Clone e Instale Dependências

```bash
cd mobile
npm install
```

### 2. Configure Variáveis de Ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 3. iOS - Instalar Pods

```bash
cd ios
pod install
cd ..
```

## ▶️ Executar

### Android

```bash
# Emulador
npm run android

# Device físico (USB debugging)
adb devices
npm run android
```

### iOS

```bash
# Simulator
npm run ios

# Device físico (requer Apple Developer Account)
npm run ios -- --device
```

## 🏗️ Build de Produção

### Android APK

```bash
cd android
./gradlew assembleRelease

# APK gerado em:
# android/app/build/outputs/apk/release/app-release.apk
```

### Android AAB (Google Play)

```bash
cd android
./gradlew bundleRelease

# AAB gerado em:
# android/app/build/outputs/bundle/release/app-release.aab
```

### iOS

```bash
# Via Xcode
1. Abrir ios/JBPinturas.xcworkspace
2. Product > Archive
3. Distribute App > App Store Connect
```

## 📦 Estrutura do Projeto

```
mobile/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── screens/         # Telas do app
│   ├── navigation/      # Configuração de navegação
│   ├── store/           # Redux store e slices
│   ├── database/        # WatermelonDB models e schemas
│   ├── services/        # API e serviços
│   ├── utils/           # Funções auxiliares
│   └── types/           # TypeScript types
├── android/             # Código nativo Android
├── ios/                 # Código nativo iOS
└── __tests__/           # Testes
```

## 🗄️ WatermelonDB - Schema

### Tabelas Principais

```typescript
obras
├── id (UUID)
├── nome
├── status
└── _sync (metadata)

sessoes_diarias (RDO)
├── id (UUID)
├── id_encarregado
├── geo_lat
├── geo_long
└── assinatura_url

alocacoes_tarefa
├── id (UUID)
├── id_colaborador
├── id_item_ambiente
└── status
```

## 🔄 Sincronização Offline

### Estratégia

1. **Push Local Changes**: Envia alterações locais para o servidor
2. **Pull Server Changes**: Busca alterações do servidor
3. **Conflict Resolution**: Last-Write-Wins (LWW)

### Frequência

- **Automática**: A cada 5 minutos (se conectado)
- **Manual**: Botão de sincronização
- **Evento**: Ao entrar em uma tela crítica

### Exemplo de Uso

```typescript
import { syncDatabase } from '@/services/sync';

const handleSync = async () => {
  try {
    await syncDatabase();
    Alert.alert('Sucesso', 'Sincronização concluída');
  } catch (error) {
    Alert.alert('Erro', 'Falha na sincronização');
  }
};
```

## 📸 Captura de Fotos

### Compressão Automática

```typescript
import { launchCamera } from 'react-native-image-picker';

const options = {
  mediaType: 'photo',
  quality: 0.8,
  maxWidth: 1024,
  maxHeight: 1024,
};
```

## 🔐 Permissões Necessárias

### Android (`AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS (`Info.plist`)

```xml
<key>NSCameraUsageDescription</key>
<string>Necessário para capturar fotos de evidência</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necessário para registrar localização do RDO</string>
```

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

## 🐛 Debug

### React Native Debugger

```bash
# Instalar globalmente
npm install -g react-native-debugger

# Abrir (porta 8081)
react-native-debugger
```

### Flipper

```bash
# Já vem com React Native 0.62+
# Abrir automaticamente ao rodar o app
```

### Logs

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

## 📱 Versioning

### Android

Editar `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 1        // Incrementar a cada build
    versionName "1.0.0"  // Versão visível ao usuário
}
```

### iOS

Editar `ios/JBPinturas/Info.plist`:

```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

## 🚀 CI/CD

Veja [../.github/workflows/mobile.yml](../.github/workflows/mobile.yml)

## 📚 Recursos

- [React Native Docs](https://reactnative.dev/)
- [WatermelonDB Docs](https://nozbe.github.io/WatermelonDB/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

## 👨‍💻 Desenvolvido Por

JB Pinturas Tech Team - 2026
