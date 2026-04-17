# Script de Teste Sprint 3 - RF07 e RF09
# Data: 10 de fevereiro de 2026

$baseUrl = "http://localhost:3000/api"
$testResults = @()

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "TESTE SPRINT 3 - RF07 + RF09" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

function Add-TestResult {
    param($name, $status, $message, $details = $null)
    $script:testResults += [PSCustomObject]@{
        Teste = $name
        Status = $status
        Mensagem = $message
        Detalhes = $details
    }
    
    $color = if ($status -eq "OK") { "Green" } elseif ($status -eq "WARN") { "Yellow" } else { "Red" }
    $icon = if ($status -eq "OK") { "[OK]" } elseif ($status -eq "WARN") { "[WARN]" } elseif ($status -eq "SKIP") { "[SKIP]" } else { "[ERRO]" }
    
    Write-Host "$icon $name" -ForegroundColor $color
    if ($message) { Write-Host "   $message" -ForegroundColor Gray }
    if ($details) { Write-Host "   $details" -ForegroundColor DarkGray }
}

# TESTE 1: LOGIN
Write-Host "`n[1] Testando Login..." -ForegroundColor Yellow

try {
    $loginBody = @{
        login = "admin"
        senha = "Admin@123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $token = $loginResponse.access_token
    $usuario = $loginResponse.usuario

    Add-TestResult "Login" "OK" "Usuario autenticado: $($usuario.nome)" "Token obtido"
    
} catch {
    Add-TestResult "Login" "ERRO" "Falha ao fazer login" $_.Exception.Message
    Write-Host "`nNao e possivel continuar os testes sem autenticacao." -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# TESTE 2: RF09 - PUSH NOTIFICATIONS
Write-Host "`n[2] Testando RF09 - Push Notifications..." -ForegroundColor Yellow

# 2.1. Estatisticas de Push
try {
    $statsResponse = Invoke-RestMethod -Uri "$baseUrl/push/stats" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    Add-TestResult "Push - Estatisticas" "OK" `
        "Total: $($statsResponse.total_usuarios) | Com token: $($statsResponse.usuarios_com_token) | Percentual: $($statsResponse.percentual)%" `
        "Endpoint: GET /push/stats"
        
} catch {
    Add-TestResult "Push - Estatisticas" "ERRO" "Falha ao obter estatisticas" $_.Exception.Message
}

# 2.2. Registrar Token FCM (simulado)
try {
    $registerBody = @{
        fcm_token = "teste_fcm_token_" + [guid]::NewGuid().ToString().Substring(0,8)
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/push/register-token" `
        -Method POST `
        -Headers $headers `
        -Body $registerBody `
        -ErrorAction Stop

    Add-TestResult "Push - Registrar Token" "OK" `
        "Token FCM registrado com sucesso" `
        "Endpoint: POST /push/register-token"
        
} catch {
    Add-TestResult "Push - Registrar Token" "ERRO" "Falha ao registrar token" $_.Exception.Message
}

# 2.3. Verificar estatisticas apos registro
try {
    $statsResponse2 = Invoke-RestMethod -Uri "$baseUrl/push/stats" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    if ($statsResponse2.usuarios_com_token -gt $statsResponse.usuarios_com_token) {
        Add-TestResult "Push - Incremento de Token" "OK" `
            "Token incrementado: $($statsResponse.usuarios_com_token) -> $($statsResponse2.usuarios_com_token)"
    } else {
        Add-TestResult "Push - Incremento de Token" "WARN" `
            "Token ja estava registrado (contador nao mudou)"
    }
        
} catch {
    Add-TestResult "Push - Incremento de Token" "ERRO" "Falha ao verificar estatisticas" $_.Exception.Message
}

# 2.4. Teste de envio (sem Firebase configurado, deve falhar graciosamente)
try {
    $testPushBody = @{
        titulo = "Teste Sprint 3"
        mensagem = "Testando push notifications"
    } | ConvertTo-Json

    $testPushResponse = Invoke-RestMethod -Uri "$baseUrl/push/test" `
        -Method POST `
        -Headers $headers `
        -Body $testPushBody `
        -ErrorAction Stop

    Add-TestResult "Push - Envio de Teste" "OK" `
        "Endpoint de teste executado" `
        "Mensagem: $($testPushResponse.message)"
        
} catch {
    $errorMessage = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorMessage.message -like "*Firebase*" -or $errorMessage.message -like "*nao configurado*") {
        Add-TestResult "Push - Envio de Teste" "WARN" `
            "Firebase nao configurado (esperado)" `
            "Configure Firebase para habilitar envio de push"
    } else {
        Add-TestResult "Push - Envio de Teste" "ERRO" "Erro inesperado" $_.Exception.Message
    }
}

# TESTE 3: RF07 - SESSOES
Write-Host "`n[3] Testando RF07 - Sessoes..." -ForegroundColor Yellow

# 3.1. Buscar obras disponiveis
try {
    $obrasResponse = Invoke-RestMethod -Uri "$baseUrl/obras" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    if ($obrasResponse.Count -gt 0) {
        $obraId = $obrasResponse[0].id
        Add-TestResult "Sessoes - Listar Obras" "OK" `
            "Encontradas $($obrasResponse.Count) obras" `
            "Primeira obra: ID=$obraId - $($obrasResponse[0].nome)"
    } else {
        Add-TestResult "Sessoes - Listar Obras" "WARN" `
            "Nenhuma obra cadastrada" `
            "Cadastre uma obra para testar alocacoes"
        $obraId = $null
    }
        
} catch {
    Add-TestResult "Sessoes - Listar Obras" "ERRO" "Falha ao listar obras" $_.Exception.Message
    $obraId = $null
}

# 3.2. Buscar sessao aberta (se houver obra)
if ($obraId) {
    try {
        $sessaoResponse = Invoke-RestMethod -Uri "$baseUrl/sessoes/aberta/$($usuario.id)" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop

        if ($sessaoResponse) {
            Add-TestResult "Sessoes - Buscar Sessao Aberta" "OK" `
                "Sessao encontrada: ID=$($sessaoResponse.id)" `
                "Obra: $($sessaoResponse.id_obra) | Status: $($sessaoResponse.status)"
            $sessaoId = $sessaoResponse.id
        } else {
            Add-TestResult "Sessoes - Buscar Sessao Aberta" "WARN" `
                "Nenhuma sessao aberta para o encarregado"
            $sessaoId = $null
        }
            
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Add-TestResult "Sessoes - Buscar Sessao Aberta" "WARN" `
                "Nenhuma sessao aberta (404)" `
                "Endpoint funcionando corretamente"
            $sessaoId = $null
        } else {
            Add-TestResult "Sessoes - Buscar Sessao Aberta" "ERRO" "Erro ao buscar sessao" $_.Exception.Message
            $sessaoId = $null
        }
    }
}

# TESTE 4: RF07 - ALOCACOES
Write-Host "`n[4] Testando RF07 - Alocacoes..." -ForegroundColor Yellow

# 4.1. Listar colaboradores (se houver sessao)
if ($obraId) {
    try {
        $colaboradoresResponse = Invoke-RestMethod -Uri "$baseUrl/colaboradores" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop

        if ($colaboradoresResponse.Count -gt 0) {
            $colaboradorId = $colaboradoresResponse[0].id
            Add-TestResult "Alocacoes - Listar Colaboradores" "OK" `
                "Encontrados $($colaboradoresResponse.Count) colaboradores" `
                "Primeiro: ID=$colaboradorId - $($colaboradoresResponse[0].nome)"
        } else {
            Add-TestResult "Alocacoes - Listar Colaboradores" "WARN" `
                "Nenhum colaborador cadastrado"
            $colaboradorId = $null
        }
            
} catch {
        Add-TestResult "Alocacoes - Listar Colaboradores" "ERRO" "Falha ao listar colaboradores" $_.Exception.Message
        $colaboradorId = $null
    }
} else {
    Add-TestResult "Alocacoes - Listar Colaboradores" "SKIP" `
        "Teste pulado (sem obra cadastrada)"
    $colaboradorId = $null
}

# 4.2. Obter estatisticas de alocacao
if ($obraId) {
    try {
        # Criar sessao temporaria para teste
        $criarSessaoBody = @{
            id_obra = $obraId
            id_encarregado = $usuario.id
            geo_lat = -23.550520
            geo_long = -46.633308
        } | ConvertTo-Json

        $novaSessaoResponse = Invoke-RestMethod -Uri "$baseUrl/sessoes" `
            -Method POST `
            -Headers $headers `
            -Body $criarSessaoBody `
            -ErrorAction SilentlyContinue

        if ($novaSessaoResponse) {
            $sessaoId = $novaSessaoResponse.id
            
            $statsAlocacaoResponse = Invoke-RestMethod -Uri "$baseUrl/alocacoes/estatisticas/$sessaoId" `
                -Method GET `
                -Headers $headers `
                -ErrorAction Stop

            Add-TestResult "Alocacoes - Estatisticas" "OK" `
                "Total: $($statsAlocacaoResponse.total_alocacoes) | Em andamento: $($statsAlocacaoResponse.em_andamento) | Concluidas: $($statsAlocacaoResponse.concluidas)"
        } else {
            Add-TestResult "Alocacoes - Estatisticas" "SKIP" `
                "Nao foi possivel criar sessao de teste"
        }
            
    } catch {
        Add-TestResult "Alocacoes - Estatisticas" "ERRO" "Falha ao obter estatisticas" $_.Exception.Message
    }
} else {
    Add-TestResult "Alocacoes - Estatisticas" "SKIP" `
        "Teste pulado (sem obra)"
}

# RELATORIO FINAL
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RELATORIO FINAL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$sucessos = ($testResults | Where-Object { $_.Status -eq "OK" }).Count
$avisos = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$erros = ($testResults | Where-Object { $_.Status -eq "ERRO" }).Count
$pulados = ($testResults | Where-Object { $_.Status -eq "SKIP" }).Count
$total = $testResults.Count

Write-Host "Total de testes: $total" -ForegroundColor White
Write-Host "Sucessos: $sucessos" -ForegroundColor Green
Write-Host "Avisos: $avisos" -ForegroundColor Yellow
Write-Host "Erros: $erros" -ForegroundColor Red
Write-Host "Pulados: $pulados" -ForegroundColor Gray

$percentualSucesso = if ($total -gt 0) { [math]::Round(($sucessos / ($total - $pulados)) * 100, 1) } else { 0 }
Write-Host "`nPercentual de sucesso: $percentualSucesso%" -ForegroundColor $(if ($percentualSucesso -ge 80) { "Green" } elseif ($percentualSucesso -ge 60) { "Yellow" } else { "Red" })

Write-Host "`n========================================`n" -ForegroundColor Cyan

$testResults | Format-Table -AutoSize

Write-Host "`nDicas:" -ForegroundColor Cyan
Write-Host "- Para testar RF07 drag & drop: compile e rode o app mobile" -ForegroundColor Gray
Write-Host "- Para testar RF09 push: configure Firebase (ver FIREBASE_SETUP.md)" -ForegroundColor Gray
Write-Host ""
