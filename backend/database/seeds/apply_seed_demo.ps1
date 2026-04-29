$ErrorActionPreference = 'Stop'

Set-Location (Join-Path $PSScriptRoot '..\..')

Write-Host 'Aplicando seed de demonstracao (TypeORM/Node)...' -ForegroundColor Cyan
npm run seed:demo

Write-Host ''
Write-Host 'Seed aplicado com sucesso.' -ForegroundColor Green
Write-Host 'Credenciais demo (senha: Demo@2026):' -ForegroundColor Yellow
Write-Host ' - admin.demo@jbpinturas.com.br'
Write-Host ' - gestor.demo@jbpinturas.com.br'
Write-Host ' - financeiro.demo@jbpinturas.com.br'
Write-Host ' - encarregado1.demo@jbpinturas.com.br'
Write-Host ' - encarregado2.demo@jbpinturas.com.br'
