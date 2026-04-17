#!/usr/bin/env pwsh

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWFhYWFhYS1hYWFhLWFhYWEtYWFhYS1hYWFhYWFhYWFhYWEiLCJlbWFpbCI6ImFkbWluQGpicGludHVyYXMuY29tLmJyIiwicGVyZmlsIjoxLCJpYXQiOjE3NzI1NTA2MDUsImV4cCI6MTc3MjU1MTUwNX0.iq3LPRjLdYTIr0X1I42Js1usDjguWCJ3nmjZGF38Tyc"

Write-Host "🔍 Diagnosticando erro ao criar sessão" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋"

# Teste 1: GET sessoes
Write-Host "`n1️⃣  Testando GET /sessoes..." -ForegroundColor Yellow
try {
    $sessoes = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Get `
        -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ GET /sessoes: OK - $($sessoes.Count) sessões"
} catch {
    Write-Host "❌ GET /sessoes falhou: $($_.Exception.Message)"
    exit 1
}

# Teste 2: POST sessoes simples
Write-Host "`n2️⃣  Testando POST /sessoes (simples)..." -ForegroundColor Yellow
$payload = @{
    id_encarregado = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    data_abertura = "2026-03-03"
    observacoes = "Teste"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Headers @{Authorization="Bearer $token"} `
        -Body $payload `
        -ContentType 'application/json'
    Write-Host "✅ POST /sessoes: OK"
    Write-Host "   ID: $($response.id)"
    Write-Host "   Encarregado: $($response.id_encarregado)"
} catch {
    Write-Host "❌ POST /sessoes falhou"
    Write-Host "   Status: $($_.Exception.Response.StatusCode)"
    
    # Tenta extrair erro em JSON
    $errorBody = $_.ErrorDetails.Message
    if ($errorBody) {
        Write-Host "   Erro JSON: $errorBody"
        try {
            $err = $errorBody | ConvertFrom-Json
            Write-Host "   Detalhes: $($err.message -join ', ')"
        } catch {}
    }
    
    Write-Host "`nFull Exception:"
    Write-Host $_.Exception
}
