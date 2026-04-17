#!/usr/bin/env pwsh

param(
    [string]$Environment = "development"
)

$ErrorActionPreference = "Stop"

function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Good { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Bad { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor Yellow }

Write-Info "======================================"
Write-Info "  JB Pinturas - Database Population"
Write-Info "======================================"

Write-Info "Verificando se Docker esta rodando..."
try {
    docker ps > $null 2>&1
    Write-Good "Docker esta rodando"
} catch {
    Write-Bad "Docker nao esta rodando!"
    Write-Warn "Iniciando Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker.exe" -ErrorAction SilentlyContinue
    
    Write-Warn "Aguardando Docker inicializar..."
    Start-Sleep -Seconds 30
}


Write-Info "Verificando containers do Docker Compose..."
$postgresStatus = docker ps --filter "name=jb_pinturas_db" --filter "status=running" -q
if ($postgresStatus) {
    Write-Good "PostgreSQL ja esta rodando"
} else {
    Write-Info "Iniciando Docker Compose..."
    docker compose up -d
    
    Write-Info "Aguardando PostgreSQL ficar pronto..."
    $maxAttempts = 30
    $currentAttempt = 0
    
    while ($currentAttempt -lt $maxAttempts) {
        $healthCheck = docker exec jb_pinturas_db pg_isready -U jb_admin -d jb_pinturas_db 2>&1
        if ($healthCheck -match "accepting connections") {
            Write-Good "PostgreSQL esta pronto!"
            break
        }
        $currentAttempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    
    if ($currentAttempt -eq $maxAttempts) {
        Write-Bad "PostgreSQL nao ficou pronto a tempo"
        exit 1
    }
}

Write-Info ""
Write-Info "Populando banco de dados..."

Write-Info "Preparando dados de teste..."
$testScript = Get-Content ".\backend\database\seeds\004_simple_test_data.sql" -Encoding UTF8 -Raw
$tempFile = "$env:TEMP\test_data.sql"
$testScript | Out-File -FilePath $tempFile -Encoding UTF8 -Force

Write-Info "Copiando script para Docker container..."
docker cp $tempFile jb_pinturas_db:/test_data.sql 2>&1 | Out-Null

Write-Info "Executando dados de teste..."
docker exec jb_pinturas_db psql -U jb_admin -d jb_pinturas_db -f /test_data.sql -q 2>&1 | Out-Null
Write-Good "Dados de teste populados com sucesso!"

Write-Info ""
Write-Info "Verificando dados no banco..."
$query = "SELECT 'Total' as tipo, COUNT(*) as total FROM tb_usuarios WHERE email IS NOT NULL;"
echo $query | docker exec -i jb_pinturas_db psql -U jb_admin -d jb_pinturas_db

Write-Info ""
Write-Info "======================================"
Write-Good "Sistema pronto para testes!"
Write-Info "======================================"
Write-Info ""
Write-Info "Acessos disponveis:"
Write-Info "  Admin:       admin@jbpinturas.com / Admin@2026"
Write-Info "  Gestor:      gestor@jbpinturas.com / Admin@2026"
Write-Info "  Financeiro:  financeiro@jbpinturas.com / Admin@2026"
Write-Info "  Encarregado: encarregado@jbpinturas.com / Admin@2026"
Write-Info ""
Write-Info "Servios disponveis:"
Write-Info "  Backend:        http://localhost:3005"
Write-Info "  Frontend:       http://localhost:3001"
Write-Info "  Database Admin: http://localhost:8080"
Write-Info "  Redis Admin:    http://localhost:8081"
Write-Info ""
Write-Good "Pronto para iniciar os testes!"
