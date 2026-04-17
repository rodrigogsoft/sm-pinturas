Set-Location "C:\Users\kbca_\develop\jb_pinturas"

Write-Host "Parando containers..." -ForegroundColor Yellow
docker compose down

Write-Host "Subindo containers (postgres primeiro)..." -ForegroundColor Yellow
docker compose up -d postgres
Write-Host "Aguardando Postgres ficar pronto (15s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "Subindo backend..." -ForegroundColor Yellow
docker compose up -d backend
Write-Host "Aguardando backend inicializar (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Subindo frontend..." -ForegroundColor Yellow
docker compose up -d frontend

Write-Host "`nLogs do backend (ultimas 30 linhas):" -ForegroundColor Cyan
docker compose logs backend --tail 30

Write-Host "`nStatus dos containers:" -ForegroundColor Cyan
docker compose ps
