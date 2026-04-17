# Script para testar múltiplos endpoints GET
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWFhYWFhYS1hYWFhLWFhYWEtYWFhYS1hYWFhYWFhYWFhYWEiLCJlbWFpbCI6ImFkbWluQGpicGludHVyYXMuY29tLmJyIiwicGVyZmlsIjoxLCJpYXQiOjE3NzI1NTA2MDUsImV4cCI6MTc3MjU1MTUwNX0.iq3LPRjLdYTIr0X1I42Js1usDjguWCJ3nmjZGF38Tyc"
$headers = @{ Authorization = "Bearer $token" }

$endpoints = @(
    'clientes',
    'servicos',
    'pavimentos',
    'ambientes',
    'sessoes',
    'precos',
    'relatorios/dashboard-financeiro'
)

$endpoints | ForEach-Object {
    $uri = "http://localhost:3006/api/v1/$_"
    Write-Host "`n=== GET /$_ ===" -ForegroundColor Cyan
    try {
        $result = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
        $count = @($result).Count
        Write-Host "✅ OK - Records: $count"
    } catch {
        Write-Host "❌ ERRO"
        Write-Host $_.Exception.Message
    }
}
