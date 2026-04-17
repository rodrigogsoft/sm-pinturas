#!/usr/bin/env powershell
# Teste com diferentes formatos de data

$login = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/auth/login' `
    -Method Post `
    -Body (ConvertTo-Json @{email='admin@jbpinturas.com.br'; password='Admin@2026'}) `
    -ContentType 'application/json'

$token = $login.access_token

$colaboradores = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/colaboradores' `
    -Headers @{Authorization="Bearer $token"}

$id_encarregado = $colaboradores[0].id

# Testar diferentes formatos de data
$now = Get-Date

# Formato 1: ISO completo com Z
$isoFull1 = $now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
Write-Host "Formato 1 (ISO full com Z): $isoFull1"

# Formato 2: ISO sem milissegundos
$isoFull2 = $now.ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-Host "Formato 2 (ISO sem ms): $isoFull2"

# Formato 3: Apenas data
$isoDay = $now.ToString("yyyy-MM-dd")
Write-Host "Formato 3 (apenas data): $isoDay"

# Teste com ISO 8601 simples
$payload = @{
    id_encarregado = $id_encarregado
    data_sessao = "$isoDay"
    hora_inicio = "$($now.ToString('yyyy-MM-ddTHH:mm:ss'))Z"
    assinatura_url = "data:image/png;base64,test"
    observacoes = "Teste"
} | ConvertTo-Json

Write-Host "`nTestando POST /sessoes..."
Write-Host "Payload: $payload"

try {
    $newSession = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Headers @{Authorization="Bearer $token"} `
        -Body $payload `
        -ContentType 'application/json'
    
    Write-Host "`nSUCESSO! Sessao criada:"
    Write-Host "ID: $($newSession.id)"
    
} catch {
    Write-Host "`nERRO:"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
