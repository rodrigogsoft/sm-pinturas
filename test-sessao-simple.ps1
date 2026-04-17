#!/usr/bin/env pwsh
# Simples teste de sessao sem emojis problemáticos

try {
    Write-Host "Fazendo login..."
    $login = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/auth/login' `
        -Method Post `
        -Body (ConvertTo-Json @{email='admin@jbpinturas.com.br'; password='Admin@2026'}) `
        -ContentType 'application/json'
    
    $token = $login.access_token
    Write-Host "Login OK, token: $($token.Substring(0,20))..."
    
    Write-Host "`nTestando GET /sessoes..."
    $sessoes = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Get `
        -Headers @{Authorization="Bearer $token"}
    Write-Host "GET OK: $($sessoes.Count) sessoes"
    
    Write-Host "`nTestando POST /sessoes..."
    $now = Get-Date
    $isoDate = $now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $isoDay = $now.ToString("yyyy-MM-dd")
    
    $payload = @{
        id_encarregado = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        data_sessao = $isoDay
        hora_inicio = $isoDate
        assinatura_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        observacoes = "Teste de criacao"
    } | ConvertTo-Json
    
    $newSession = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/sessoes' `
        -Method Post `
        -Headers @{Authorization="Bearer $token"} `
        -Body $payload `
        -ContentType 'application/json'
    
    Write-Host "POST OK: Sessao criada com ID $($newSession.id)"
    
} catch {
    Write-Host "ERRO CAPTURADO:"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    Write-Host "Message: $($_.Exception.Message)"
    
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
