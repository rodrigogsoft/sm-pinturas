# Script para testar GET /obras
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWFhYWFhYS1hYWFhLWFhYWEtYWFhYS1hYWFhYWFhYWFhYWEiLCJlbWFpbCI6ImFkbWluQGpicGludHVyYXMuY29tLmJyIiwicGVyZmlsIjoxLCJpYXQiOjE3NzI1NTA2MDUsImV4cCI6MTc3MjU1MTUwNX0.iq3LPRjLdYTIr0X1I42Js1usDjguWCJ3nmjZGF38Tyc"
$headers = @{ Authorization = "Bearer $token" }

try {
    Write-Host "Testando GET /obras..."
    $result = Invoke-RestMethod -Uri 'http://localhost:3006/api/v1/obras' -Method Get -Headers $headers
    Write-Host "Sucesso! Registros: " ($result | Measure-Object).Count
    $result | ConvertTo-Json -Depth 2 | Out-Host
} catch {
    Write-Host "ERRO:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:" 
        Write-Host $_.ErrorDetails.Message
    }
}
