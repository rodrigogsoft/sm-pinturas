# =============================================================================
# Script: setup-github-repo.ps1
# Descrição: Cria o repositório SM_Pinturas no GitHub (perfil pessoal, privado),
#            faz o push inicial, cria as branches homol e producao e configura
#            proteção de branches via GitHub CLI (gh).
#
# Pré-requisitos:
#   1. GitHub CLI instalado: https://cli.github.com/
#   2. Autenticado: gh auth login
#   3. Git configurado localmente
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Configurações — ajuste se necessário
# ---------------------------------------------------------------------------
$REPO_NAME      = "SM_Pinturas"
$VISIBILITY     = "private"          # private | public
$DEFAULT_BRANCH = "main"             # branch principal (já existente localmente)
$HOMOL_BRANCH   = "homol"
$PROD_BRANCH    = "producao"
$DESCRIPTION    = "Sistema de gestão de obras e pagamentos — SM Pinturas"

# ---------------------------------------------------------------------------
# 1. Verificar pré-requisitos
# ---------------------------------------------------------------------------
Write-Host "`n[1/6] Verificando pré-requisitos..." -ForegroundColor Cyan

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) não encontrado. Instale em: https://cli.github.com/"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git não encontrado. Instale em: https://git-scm.com/"
}

$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Você não está autenticado no GitHub CLI. Execute: gh auth login"
}

Write-Host "  OK — gh e git disponíveis e autenticados." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 2. Inicializar git local (se ainda não for um repositório)
# ---------------------------------------------------------------------------
Write-Host "`n[2/6] Verificando repositório git local..." -ForegroundColor Cyan

$gitDir = Join-Path $PSScriptRoot ".git"
if (-not (Test-Path $gitDir)) {
    Write-Host "  Inicializando git..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "chore: commit inicial do projeto SM_Pinturas"
} else {
    Write-Host "  Repositório git já existe." -ForegroundColor Green
}

# Garante que a branch padrão se chama 'main'
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne $DEFAULT_BRANCH) {
    Write-Host "  Renomeando branch '$currentBranch' para '$DEFAULT_BRANCH'..." -ForegroundColor Yellow
    git branch -m $currentBranch $DEFAULT_BRANCH
}

# ---------------------------------------------------------------------------
# 3. Criar repositório remoto no GitHub
# ---------------------------------------------------------------------------
Write-Host "`n[3/6] Criando repositório '$REPO_NAME' no GitHub..." -ForegroundColor Cyan

gh repo create $REPO_NAME `
    --$VISIBILITY `
    --description $DESCRIPTION `
    --source . `
    --remote origin `
    --push

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao criar repositório no GitHub."
}

Write-Host "  Repositório criado e push de '$DEFAULT_BRANCH' realizado." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 4. Criar branches homol e producao a partir de main
# ---------------------------------------------------------------------------
Write-Host "`n[4/6] Criando branches '$HOMOL_BRANCH' e '$PROD_BRANCH'..." -ForegroundColor Cyan

git checkout -b $HOMOL_BRANCH
git push origin $HOMOL_BRANCH
Write-Host "  Branch '$HOMOL_BRANCH' criada e enviada." -ForegroundColor Green

git checkout -b $PROD_BRANCH
git push origin $PROD_BRANCH
Write-Host "  Branch '$PROD_BRANCH' criada e enviada." -ForegroundColor Green

# Volta para main
git checkout $DEFAULT_BRANCH

# ---------------------------------------------------------------------------
# 5. Configurar proteção das branches (requer repositório já existente)
# ---------------------------------------------------------------------------
Write-Host "`n[5/6] Configurando proteção de branches..." -ForegroundColor Cyan

# Obtém o usuário autenticado para montar o nome completo do repo
$ghUser = gh api user --jq ".login"
$FULL_REPO = "$ghUser/$REPO_NAME"

# Helper para configurar proteção via API REST
function Set-BranchProtection {
    param(
        [string]$Branch,
        [bool]$RequireReview = $true,
        [int]$MinReviewers   = 1
    )

    $body = @{
        required_status_checks          = $null
        enforce_admins                  = $true
        required_pull_request_reviews   = if ($RequireReview) {
            @{
                dismiss_stale_reviews           = $true
                require_code_owner_reviews      = $false
                required_approving_review_count = $MinReviewers
            }
        } else { $null }
        restrictions                    = $null
        allow_force_pushes              = $false
        allow_deletions                 = $false
    } | ConvertTo-Json -Depth 5

    gh api `
        --method PUT `
        -H "Accept: application/vnd.github+json" `
        "/repos/$FULL_REPO/branches/$Branch/protection" `
        --input - <<< $body | Out-Null

    Write-Host "  Proteção aplicada na branch '$Branch'." -ForegroundColor Green
}

Set-BranchProtection -Branch $DEFAULT_BRANCH -RequireReview $true  -MinReviewers 1
Set-BranchProtection -Branch $HOMOL_BRANCH   -RequireReview $true  -MinReviewers 1
Set-BranchProtection -Branch $PROD_BRANCH    -RequireReview $true  -MinReviewers 1

# ---------------------------------------------------------------------------
# 6. Resumo final
# ---------------------------------------------------------------------------
Write-Host "`n[6/6] Configuração concluída!" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Repositório : https://github.com/$FULL_REPO" -ForegroundColor White
Write-Host "  Branches    :" -ForegroundColor White
Write-Host "    main      — desenvolvimento principal (padrão)" -ForegroundColor White
Write-Host "    homol     — homologação / QA" -ForegroundColor White
Write-Host "    producao  — ambiente de produção" -ForegroundColor White
Write-Host ""
Write-Host "  Fluxo recomendado de merge:" -ForegroundColor Yellow
Write-Host "    feature/* → main → homol → producao" -ForegroundColor Yellow
Write-Host ""
