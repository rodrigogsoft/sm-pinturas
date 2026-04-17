#!/usr/bin/env powershell
# Obter usuários reais do banco de dados

$login = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/auth/login' `
    -Method Post `
    -Body (ConvertTo-Json @{email='admin@jbpinturas.com.br'; password='Admin@2026'}) `
    -ContentType 'application/json' -UseBasicParsing

$token = $login.access_token
$adminId = $login.user.id

Write-Host "Admin user ID: $adminId"
Write-Host "`nTestando POST /sessoes com admin ID..."

$now = Get-Date
$isoDay = $now.ToString("yyyy-MM-dd")
$isoTime = $now.ToString("yyyy-MM-ddTHH:mm:ss")

$jsonBody = @{
  id_encarregado = $adminId
  data_sessao = $isoDay
  hora_inicio = "$isoTime`Z"
  assinatura_url = "data:image/png;base64,test"
  observacoes = "Teste com ID real"
} | ConvertTo-Json

Write-Host "Payload:`n$jsonBody"
Write-Host "`n`nEnviando POST /sessoes..."

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Body $jsonBody `
        -ContentType 'application/json' `
        -Headers @{Authorization="Bearer $token"} `
        -UseBasicParsing
    
    Write-Host "SUCESSO! Status: $($response.StatusCode)"
    Write-Host "Response:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json
    
} catch {
    Write-Host "ERRO: $($_.Exception.Response.StatusCode)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
