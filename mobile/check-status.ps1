# Verificador de Status da Compilação Android

Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   STATUS DA COMPILAÇÃO ANDROID        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar processos Gradle/Java
$gradleProcess = Get-Process java -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*gradle*" -or $_.CommandLine -like "*gradle*" }

if ($gradleProcess) {
    Write-Host "✓ Gradle em execução" -ForegroundColor Green
    $runtime = (Get-Date) - $gradleProcess[0].StartTime
    Write-Host "  Tempo decorrido: $($runtime.Minutes)m $($runtime.Seconds)s" -ForegroundColor Gray
} else {
    Write-Host "⚠ Gradle não está em execução" -ForegroundColor Yellow
}

# Verificar Metro Bundler
$metroProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" -or $_.CommandLine -like "*react-native*" }

if ($metroProcess) {
    Write-Host "✓ Metro Bundler em execução" -ForegroundColor Green
} else {
    Write-Host "⚠ Metro Bundler não está em execução" -ForegroundColor Yellow
}

# Verificar backend
$backendRunning = Test-NetConnection localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backendRunning) {
    Write-Host "✓ Backend em execução (porta 3000)" -ForegroundColor Green
} else {
    Write-Host "✗ Backend não está em execução" -ForegroundColor Red
}

# Verificar dispositivos Android
Write-Host "`n📱 Dispositivos Android:" -ForegroundColor Cyan
adb devices 2>$null

# Verificar arquivos de build
Write-Host "`n📦 Status do Build:" -ForegroundColor Cyan
if (Test-Path "android\app\build\outputs\apk\debug\app-debug.apk") {
    $apkFile = Get-Item "android\app\build\outputs\apk\debug\app-debug.apk"
    Write-Host "✓ APK gerado: $($apkFile.LastWriteTime)" -ForegroundColor Green
    Write-Host "  Tamanho: $([math]::Round($apkFile.Length / 1MB, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "⏳ APK ainda não foi gerado (compilação em andamento)" -ForegroundColor Yellow
}

Write-Host "`n💡 Dicas:" -ForegroundColor Cyan
Write-Host "  - Primeira compilação: 5-10 minutos" -ForegroundColor Gray
Write-Host "  - Próximas compilações: 30-60 segundos" -ForegroundColor Gray
Write-Host "  - Aguarde a mensagem 'BUILD SUCCESSFUL'" -ForegroundColor Gray

Write-Host "`n"
