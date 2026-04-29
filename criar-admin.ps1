# =============================================================
# Script interativo para criar usuário administrador
# SM Pinturas & Construções
# =============================================================

param(
    [string]$Ambiente = ""
)

$SSH_KEY = "$env:USERPROFILE\.ssh\vps_aapanel"
$SSH_HOST = "root@108.174.144.242"
$SSH_PORT = "22022"

function Ssh-Cmd($cmd) {
    ssh -i $SSH_KEY -p $SSH_PORT $SSH_HOST $cmd
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SM Pinturas — Criar Usuário Administrador      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Selecionar ambiente
if ($Ambiente -eq "") {
    Write-Host "Selecione o ambiente:" -ForegroundColor Yellow
    Write-Host "  [1] Produção   (sm_pinturas_prod)"
    Write-Host "  [2] Homologação (sm_pinturas_homol)"
    Write-Host "  [3] Ambos"
    Write-Host ""
    $opcao = Read-Host "Opção"
    switch ($opcao) {
        "1" { $bancos = @("sm_pinturas_prod") }
        "2" { $bancos = @("sm_pinturas_homol") }
        "3" { $bancos = @("sm_pinturas_prod", "sm_pinturas_homol") }
        default {
            Write-Host "Opção inválida." -ForegroundColor Red
            exit 1
        }
    }
} else {
    $bancos = @($Ambiente)
}

Write-Host ""

# Coletar dados do usuário
Write-Host "Informe os dados do novo administrador:" -ForegroundColor Yellow
Write-Host ""

$nomeCompleto = Read-Host "Nome completo"
if ($nomeCompleto -eq "") {
    Write-Host "Nome não pode ser vazio." -ForegroundColor Red
    exit 1
}

$email = Read-Host "E-mail"
if ($email -notmatch "^[^@]+@[^@]+\.[^@]+$") {
    Write-Host "E-mail inválido." -ForegroundColor Red
    exit 1
}

# Solicitar senha com confirmação
while ($true) {
    $senha = Read-Host "Senha (mínimo 8 caracteres)" -AsSecureString
    $senhaTexto = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha)
    )
    if ($senhaTexto.Length -lt 8) {
        Write-Host "Senha deve ter pelo menos 8 caracteres." -ForegroundColor Red
        continue
    }
    $confirmacao = Read-Host "Confirme a senha" -AsSecureString
    $confirmacaoTexto = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmacao)
    )
    if ($senhaTexto -ne $confirmacaoTexto) {
        Write-Host "Senhas não conferem. Tente novamente." -ForegroundColor Red
        continue
    }
    break
}

Write-Host ""
Write-Host "Selecione o perfil:" -ForegroundColor Yellow
Write-Host "  [1] ADMINISTRADOR"
Write-Host "  [2] GESTOR"
Write-Host "  [3] FINANCEIRO"
Write-Host "  [4] ENCARREGADO"
Write-Host ""
$perfilOpcao = Read-Host "Perfil (padrão: 1)"
if ($perfilOpcao -eq "") { $perfilOpcao = "1" }
if ($perfilOpcao -notin @("1","2","3","4")) {
    Write-Host "Perfil inválido." -ForegroundColor Red
    exit 1
}
$idPerfil = [int]$perfilOpcao

$nomesPerfil = @{ 1 = "ADMINISTRADOR"; 2 = "GESTOR"; 3 = "FINANCEIRO"; 4 = "ENCARREGADO" }

Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Resumo:" -ForegroundColor White
Write-Host "  Nome:    $nomeCompleto"
Write-Host "  E-mail:  $email"
Write-Host "  Perfil:  $($nomesPerfil[$idPerfil])"
Write-Host "  Bancos:  $($bancos -join ', ')"
Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

$confirmar = Read-Host "Confirmar criação? [s/N]"
if ($confirmar -notmatch "^[sS]$") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Escapar aspas simples no nome para SQL
$nomeSql = $nomeCompleto -replace "'", "''"
$emailSql = $email -replace "'", "''"

# ── Passo 1: Enviar senha como arquivo no VPS ──────────────────────────
[System.IO.File]::WriteAllText("$env:TEMP\sm_senha_tmp.txt", $senhaTexto)
scp -i $SSH_KEY -P $SSH_PORT "$env:TEMP\sm_senha_tmp.txt" "${SSH_HOST}:/tmp/sm_admin_senha.tmp" 2>&1 | Out-Null
Remove-Item "$env:TEMP\sm_senha_tmp.txt" -Force -ErrorAction SilentlyContinue

# ── Passo 2: Gerar hash via Python (heredoc single-quoted) ─────────────
$pyScript = @'
import bcrypt
s = open('/tmp/sm_admin_senha.tmp').read().strip()
h = bcrypt.hashpw(s.encode(), bcrypt.gensalt(12)).decode()
open('/tmp/sm_admin_hash.tmp', 'w').write(h)
print('OK')
'@
Write-Host "Gerando hash da senha..." -ForegroundColor Gray
$hashResult = $pyScript | ssh -i $SSH_KEY -p $SSH_PORT $SSH_HOST "cat > /tmp/sm_genhash.py; python3 /tmp/sm_genhash.py 2>&1; rm -f /tmp/sm_genhash.py"
if ($hashResult -ne "OK") {
    Write-Host "Erro ao gerar hash: $hashResult" -ForegroundColor Red
    ssh -i $SSH_KEY -p $SSH_PORT $SSH_HOST "rm -f /tmp/sm_admin_senha.tmp /tmp/sm_admin_hash.tmp" 2>&1 | Out-Null
    exit 1
}
Write-Host "Hash gerado." -ForegroundColor Gray

# ── Passo 3: Script bash com heredoc + replace de tokens ───────────────
# Template usa TOKENS em maiusculo para substituicao segura pelo PS
$shTemplate = @'
#!/bin/bash
HASH=$(cat /tmp/sm_admin_hash.tmp)
BLOCO_INSERTS
rm -f /tmp/sm_admin_hash.tmp /tmp/sm_admin_senha.tmp
'@

# Gerar bloco de INSERTs por banco usando Replace para evitar problemas com aspas
$blocoLinhas = [System.Collections.Generic.List[string]]::new()
foreach ($db in $bancos) {
    $blocoLinhas.Add("echo '--- $db ---'")
    $linhaCount = 'CNT=$(docker exec sm_db psql -U sm_user -d DBNAME -t -c "SELECT COUNT(*) FROM tb_usuarios WHERE email = ''EMAILVAL'' AND deletado = false;" 2>&1 | tr -d " \n")'
    $blocoLinhas.Add($linhaCount.Replace('DBNAME', $db).Replace('EMAILVAL', $emailSql))
    $linhaIf = 'if [ "$CNT" != "0" ]; then'
    $linhaAviso = '  echo "AVISO: e-mail ja existe em DBNAME"'
    $blocoLinhas.Add($linhaIf)
    $blocoLinhas.Add($linhaAviso.Replace('DBNAME', $db))
    $blocoLinhas.Add('else')
    $linhaInsert = '  docker exec sm_db psql -U sm_user -d DBNAME -c "INSERT INTO tb_usuarios (nome_completo, email, senha_hash, id_perfil, ativo, deletado) VALUES (''NOMEVAL'', ''EMAILVAL'', ''$HASH'', PERFILVAL, true, false);" 2>&1'
    $blocoLinhas.Add($linhaInsert.Replace('DBNAME', $db).Replace('NOMEVAL', $nomeSql).Replace('EMAILVAL', $emailSql).Replace('PERFILVAL', $idPerfil))
    $linhaOk = "  echo 'OK: usuario criado em DBNAME'"
    $blocoLinhas.Add($linhaOk.Replace('DBNAME', $db))
    $blocoLinhas.Add('fi')
}
$bloco = $blocoLinhas -join "`n"
$shScript = $shTemplate.Replace('BLOCO_INSERTS', $bloco)

Write-Host "Criando usuario(s)..." -ForegroundColor Gray
$shScript | ssh -i $SSH_KEY -p $SSH_PORT $SSH_HOST "cat > /tmp/sm_inserir.sh; chmod 700 /tmp/sm_inserir.sh; bash /tmp/sm_inserir.sh 2>&1; rm -f /tmp/sm_inserir.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Operacao concluida com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acesse o sistema em:" -ForegroundColor Cyan
    if ($bancos -contains "sm_pinturas_prod") {
        Write-Host "  https://smpinturas.conecti.tec.br" -ForegroundColor White
    }
    if ($bancos -contains "sm_pinturas_homol") {
        Write-Host "  https://smhomol.conecti.tec.br" -ForegroundColor White
    }
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Erro durante a criacao do usuario." -ForegroundColor Red
    exit 1
}
