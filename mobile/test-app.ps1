# Script de Teste - JB Pinturas Mobile App
# Execute este script para preparar e testar o app

Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   JB PINTURAS - MOBILE TEST HELPER   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar backend
Write-Host "🔍 Verificando backend..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backendRunning) {
    Write-Host "✓ Backend rodando em http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "✗ Backend NÃO está rodando!" -ForegroundColor Red
    Write-Host "  Inicie o backend com: cd backend; npm run start:dev`n" -ForegroundColor Yellow
    exit
}

# Verificar arquivo .env
if (Test-Path .env) {
    Write-Host "✓ Arquivo .env configurado" -ForegroundColor Green
} else {
    Write-Host "⚠ Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ Arquivo .env criado" -ForegroundColor Green
}

# Verificar dependências
if (Test-Path node_modules) {
    Write-Host "✓ Dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "⚠ Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Verificar dispositivos Android
Write-Host "`n🔍 Verificando dispositivos Android..." -ForegroundColor Yellow
$devices = adb devices 2>$null | Select-String "device$" -NotMatch "List of devices attached"

if ($devices) {
    Write-Host "✓ Dispositivos encontrados:" -ForegroundColor Green
    adb devices
} else {
    Write-Host "⚠ Nenhum dispositivo detectado" -ForegroundColor Yellow
    Write-Host "`nOpções:" -ForegroundColor Cyan
    Write-Host "  1. Abra Android Studio e inicie um emulador" -ForegroundColor White
    Write-Host "  2. Conecte um dispositivo físico via USB" -ForegroundColor White
    Write-Host "     (Ative 'Depuração USB' nas opções de desenvolvedor)" -ForegroundColor Gray
}

# Menu de opções
Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         OPÇÕES DE EXECUÇÃO            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "[1] Iniciar Metro Bundler apenas" -ForegroundColor Yellow
Write-Host "[2] Executar no Android (precisa de dispositivo)" -ForegroundColor Yellow
Write-Host "[3] Verificar dispositivos conectados" -ForegroundColor Yellow
Write-Host "[4] Ver logs do Metro Bundler" -ForegroundColor Yellow
Write-Host "[5] Limpar cache e reinstalar" -ForegroundColor Yellow
Write-Host "[0] Sair`n" -ForegroundColor Yellow

$choice = Read-Host "Escolha uma opção"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Iniciando Metro Bundler..." -ForegroundColor Green
        npm start
    }
    "2" {
        Write-Host "`n🚀 Compilando e instalando no Android..." -ForegroundColor Green
        npm run android
    }
    "3" {
        Write-Host "`n📱 Dispositivos conectados:" -ForegroundColor Green
        adb devices
    }
    "4" {
        Write-Host "`n📋 Para ver os logs, use:" -ForegroundColor Cyan
        Write-Host "   adb logcat | Select-String 'ReactNativeJS'" -ForegroundColor White
    }
    "5" {
        Write-Host "`n🧹 Limpando cache..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
        npx react-native start --reset-cache
    }
    "0" {
        Write-Host "`n👋 Até logo!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "`n⚠ Opção inválida" -ForegroundColor Red
    }
}
