# Script para testar RF10
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWFhYWFhYS1hYWFhLWFhYWEtYWFhYS1hYWFhYWFhYWFhYWEiLCJlbWFpbCI6ImFkbWluQGpicGludHVyYXMuY29tLmJyIiwicGVyZmlsIjoxLCJpYXQiOjE3NzI1NTA2MDUsImV4cCI6MTc3MjU1MTUwNX0.iq3LPRjLdYTIr0X1I42Js1usDjguWCJ3nmjZGF38Tyc"
$headers = @{ Authorization = "Bearer $token" }

Write-Host "=== RF10: Testando GET /medicoes/pendentes-pagamento ===" -ForegroundColor Magenta

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/medicoes/pendentes-pagamento' -Method Get -Headers $headers
    $count = @($result).Count
    Write-Host "✅ OK - Medições pendentes encontradas: $count"  -ForegroundColor Green
    
    if ($count -gt 0) {
        Write-Host "`nDados retornados:" -ForegroundColor Cyan
        $result | ConvertTo-Json -Depth 5
    } else {
        Write-Host "⚠️  Nenhuma medição pendente encontrada (esperado se nenhuma foi criada)"
    }
    
} catch {
    Write-Host "❌ ERRO" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Detalhes:"
        Write-Host $_.ErrorDetails.Message
    }
}
