#!/usr/bin/env powershell
# Obter UUID válido de colaborador

$login = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/auth/login' `
    -Method Post `
    -Body (ConvertTo-Json @{email='admin@jbpinturas.com.br'; password='Admin@2026'}) `
    -ContentType 'application/json'

$token = $login.access_token

$colaboradores = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/colaboradores' `
    -Headers @{Authorization="Bearer $token"}

Write-Host "Colaboradores encontrados: $($colaboradores.Count)"
Write-Host "Primeiro colaborador ID: $($colaboradores[0].id)"
Write-Host "Nome: $($colaboradores[0].nome)"

$id_encarregado = $colaboradores[0].id
Write-Host "`n`nTestando POST /sessoes com ID valido..."

$now = Get-Date
$isoDate = $now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$isoDay = $now.ToString("yyyy-MM-dd")

$payload = @{
    id_encarregado = $id_encarregado
    data_sessao = $isoDay
    hora_inicio = $isoDate
    assinatura_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    observacoes = "Teste de criacao"
} | ConvertTo-Json

Write-Host "Payload: $payload"

try {
    $newSession = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Headers @{Authorization="Bearer $token"} `
        -Body $payload `
        -ContentType 'application/json'
    
    Write-Host "SUCESSO! Sessao criada:"
    $newSession | ConvertTo-Json
    
} catch {
    Write-Host "ERRO:"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
