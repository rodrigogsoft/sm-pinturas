#!/usr/bin/env powershell
# Testar criação de sessão com data futura

$login = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/auth/login' `
    -Method Post `
    -Body (ConvertTo-Json @{email='admin@jbpinturas.com.br'; password='Admin@2026'}) `
    -ContentType 'application/json' -UseBasicParsing

$token = $login.access_token
$adminId = $login.user.id

Write-Host "Admin user ID: $adminId"

# Usar data de amanhã
$tomorrow = (Get-Date).AddDays(1)
$isoDay = $tomorrow.ToString("yyyy-MM-dd")
$isoTime = $tomorrow.ToString("yyyy-MM-ddTHH:mm:ss")

$jsonBody = @{
  id_encarregado = $adminId
  data_sessao = $isoDay
  hora_inicio = "$isoTime`Z"
  assinatura_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  observacoes = "Sessao de teste - criada via API"
} | ConvertTo-Json

Write-Host "Criando sessao para $isoDay..."
Write-Host "Body: $jsonBody`n"

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Body $jsonBody `
        -ContentType 'application/json' `
        -Headers @{Authorization="Bearer $token"} `
        -UseBasicParsing
    
    Write-Host "SUCESSO! Status: $($response.StatusCode)"
    Write-Host "`nSessionID criado:"
    $result = $response.Content | ConvertFrom-Json
    Write-Host "ID: $($result.id)"
    Write-Host "Status: $($result.status)"
    Write-Host "Data: $($result.data_sessao)"
    
} catch {
    Write-Host "ERRO: $($_.Exception.Response.StatusCode)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
