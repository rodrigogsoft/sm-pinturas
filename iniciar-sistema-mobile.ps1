param(
  [int]$MetroPort = 8082,
  [switch]$SemMobile
)

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobilePath = Join-Path $repoPath "mobile"

Set-Location $repoPath

Write-Host "Subindo sistema (Docker Compose)..." -ForegroundColor Yellow
docker compose up -d

Write-Host "`nStatus dos containers:" -ForegroundColor Cyan
docker compose ps

if ($SemMobile) {
  Write-Host "`nSistema iniciado. Mobile ignorado por -SemMobile." -ForegroundColor Green
  exit 0
}

Write-Host "`nIniciando Metro na porta $MetroPort em nova janela..." -ForegroundColor Yellow
$metroCmd = "Set-Location '$mobilePath'; npm run start -- --port $MetroPort"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $metroCmd | Out-Null

Start-Sleep -Seconds 5

Write-Host "Iniciando app Android em nova janela..." -ForegroundColor Yellow
$androidCmd = "Set-Location '$mobilePath'; npm run android -- --port $MetroPort"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $androidCmd | Out-Null

Write-Host "`nSistema + mobile inicializados." -ForegroundColor Green
Write-Host "Metro: http://localhost:$MetroPort" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3010" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3005" -ForegroundColor Green
