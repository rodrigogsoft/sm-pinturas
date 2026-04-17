# Guia Rápido - Teste do App Mobile

## 📱 Pré-requisitos

- ✅ Node.js instalado
- ✅ Android Studio (para emulador Android)
- ✅ Backend rodando em `http://localhost:3000`

## 🚀 Iniciar o Aplicativo

### Opção 1: Script Automático (Recomendado)

```powershell
cd mobile
.\test-app.ps1
```

### Opção 2: Comandos Manuais

1. **Iniciar Metro Bundler:**
   ```powershell
   npm start
   ```

2. **Em outro terminal, rodar no Android:**
   ```powershell
   npm run android
   ```

## 📱 Configurar Emulador Android

### Via Android Studio:
1. Abra o Android Studio
2. Vá em `Tools > Device Manager`
3. Crie ou inicie um dispositivo virtual (AVD)
4. Espere o emulador inicializar completamente

### Verificar dispositivos:
```powershell
adb devices
```

## 🔧 Comandos Úteis

### Limpar cache:
```powershell
npm start -- --reset-cache
```

### Ver logs do app:
```powershell
adb logcat | Select-String 'ReactNativeJS'
```

### Reinstalar app:
```powershell
adb uninstall com.jbpinturas
npm run android
```

### Abrir menu de desenvolvimento (no emulador):
- Pressione `Ctrl + M` ou `Cmd + M`
- Ou agite o dispositivo físico

## 🌐 URLs Importantes

- **Backend API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs
- **Metro Bundler:** http://localhost:8081

## 🧪 Testando Funcionalidades

### 1. Login
- Email: `admin@jbpinturas.com`
- Senha: (conforme configurado no backend)

### 2. Navegar pelas telas:
- ✅ Home (Dashboard com dados reais)
- ✅ Obras (Lista de obras)
- ✅ Catálogo (Serviços categorizados)
- ✅ Relatórios (Dashboard, Excedentes, Ranking)
- ✅ Configurações

### 3. Testar Notificações:
- Verifique o badge no HomeScreen
- Toque em uma notificação para marcá-la como lida

### 4. Testar Pull-to-Refresh:
- Arraste para baixo em qualquer tela com lista

## 🐛 Solução de Problemas

### "Could not connect to development server"
```powershell
# Reinicie o Metro Bundler
npm start -- --reset-cache
```

### "Unable to load script"
```powershell
# Limpe o cache e reinstale
Remove-Item -Recurse -Force android\app\build
npm run android
```

### Emulador não aparece em `adb devices`
```powershell
# Reinicie o adb
adb kill-server
adb start-server
adb devices
```

### Erro de porta em uso
```powershell
# Mate processos na porta 8081
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## 📊 Status Atual

### ✅ Implementado:
- Home com dados reais da API
- Catálogo de Serviços (RF05)
- Relatórios (RF11)
- Notificações em tempo real
- Navegação completa
- Pull-to-refresh

### ⚠ Pendente:
- Testes E2E automatizados
- Instalação de tipos TypeScript (@types/react-native-vector-icons)
- Testes em dispositivo iOS

## 🔗 Endpoints Testados

Todos os endpoints abaixo devem estar funcionando:

- `GET /api/relatorios/dashboard-financeiro`
- `GET /api/notificacoes/usuario/:id`
- `GET /api/servicos`
- `GET /api/servicos/:id/estatisticas`
- `GET /api/relatorios/excedentes`
- `GET /api/relatorios/ranking-obras`
- `GET /api/obras`
- `GET /api/medicoes`

## 💡 Dicas

1. **Hot Reload:** Salve arquivos para ver mudanças instantâneas
2. **Debug Menu:** `Ctrl + M` para acessar opções de debug
3. **Logs:** Use `console.log()` e veja em `adb logcat`
4. **Network:** Verifique chamadas de API no React Native Debugger

---

**Data:** 19/02/2026  
**Versão Mobile:** 1.0.0  
**Status:** ✅ Pronto para teste
