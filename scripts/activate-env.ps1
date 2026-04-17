# Script para ativar variáveis de ambiente por ambiente
# Uso: .\scripts\activate-env.ps1 -env development|staging|production

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$env
)

Write-Host "🔧 Ativando ambiente: $env" -ForegroundColor Cyan

# Define arquivo .env baseado no ambiente
$envFile = "backend\.env.$env"

if (-Not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo não encontrado: $envFile" -ForegroundColor Red
    exit 1
}

# Copiar para .env ativo
Copy-Item $envFile "backend\.env" -Force
Write-Host "✅ Ambiente $env ativado!" -ForegroundColor Green

# Mostrar status
Write-Host ""
Write-Host "📋 Configuração Ativa:" -ForegroundColor Yellow
Select-String "^[^#]" "backend\.env" | Select-Object -First 10
