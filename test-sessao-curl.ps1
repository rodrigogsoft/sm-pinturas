#!/usr/bin/env powershell
# Teste com curl

$login = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/auth/login' `
    -Method Post `
    -Body (ConvertTo-Json @{email='admin@jbpinturas.com.br'; password='Admin@2026'}) `
    -ContentType 'application/json'

$token = $login.access_token

$colaboradores = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/colaboradores' `
    -Headers @{Authorization="Bearer $token"}

$id_encarregado = $colaboradores[0].id

# JSON manual sem PowerShell serialization
$jsonBody = @"
{
  "id_encarregado": "$id_encarregado",
  "data_sessao": "2026-03-03",
  "hora_inicio": "2026-03-03T12:44:00Z",
  "assinatura_url": "data:image/png;base64,test",
  "observacoes": "Teste"
}
"@

Write-Host "Token: $($token.Substring(0,30))..."
Write-Host "ID Encarregado: $id_encarregado"
Write-Host "JSON Body:`n$jsonBody"
Write-Host "`nTestando POST /sessoes..."

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Body $jsonBody `
        -ContentType 'application/json' `
        -Headers @{Authorization="Bearer $token"}
    
    Write-Host "SUCESSO!"
    Write-Host $response.Content
    
} catch {
    Write-Host "ERRO:$($_.Exception.Response.StatusCode)"
    Write-Host $_.Exception.Response.StatusCode
    try {
        $errorContent = $_.ErrorDetails.Message
        Write-Host "Details: $errorContent"
    } catch {
        Write-Host "Exception: $($_.Exception.Message)"
    }
}
