#!/usr/bin/env powershell
# Testar criação de sessão com data bem no futuro

$login = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/auth/login' `
    -Method Post `
    -Body (ConvertTo-Json @{email='admin@jbpinturas.com.br'; password='Admin@2026'}) `
    -ContentType 'application/json' -UseBasicParsing

$token = $login.access_token
$adminId = $login.user.id

Write-Host "Admin user ID: $adminId"
Write-Host "Token: $($token.Substring(0,30))...`n"

# Usar data 10 dias no futuro
$futureDate = (Get-Date).AddDays(10)
$isoDay = $futureDate.ToString("yyyy-MM-dd")
$isoTime = $futureDate.ToString("yyyy-MM-ddTHH:mm:ss")

Write-Host "Tentando criar sessao para $isoDay (10 dias no futuro)..."

$jsonBody = @{
  id_encarregado = $adminId
  data_sessao = $isoDay
  hora_inicio = "$isoTime`Z"
  assinatura_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  observacoes = "Teste API"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Body $jsonBody `
        -ContentType 'application/json' `
        -Headers @{Authorization="Bearer $token"} `
        -UseBasicParsing
    
    Write-Host "SUCESSO! Status: $($response.StatusCode)`n"
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Sessao ID: $($result.id)"
    Write-Host "Status: $($result.status)"
    Write-Host "Data Sessao: $($result.data_sessao)"
    Write-Host "Hora Inicio: $($result.hora_inicio)"
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "ERRO: Status $statusCode"
    if ($_.ErrorDetails) {
        $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Message: $($errorMsg.message)"
    } else {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}
