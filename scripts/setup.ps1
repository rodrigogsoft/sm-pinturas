# ============================================
# Script de Inicialização - JB Pinturas ERP (Windows)
# ============================================

Write-Host "🎨 JB Pinturas ERP - Inicialização" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar PostgreSQL
Write-Host "2. Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version
    Write-Host "✅ $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL não encontrado localmente." -ForegroundColor Yellow
    Write-Host "   Use Docker: docker-compose up -d postgres" -ForegroundColor Yellow
}
Write-Host ""

# Verificar Redis
Write-Host "3. Verificando Redis..." -ForegroundColor Yellow
try {
    $redisVersion = redis-cli --version
    Write-Host "✅ $redisVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Redis não encontrado localmente." -ForegroundColor Yellow
    Write-Host "   Use Docker: docker-compose up -d redis" -ForegroundColor Yellow
}
Write-Host ""

# Instalar dependências do backend
Write-Host "4. Instalando dependências do backend..." -ForegroundColor Yellow
Set-Location backend
if (-Not (Test-Path "node_modules")) {
    npm install
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "✅ Dependências já instaladas" -ForegroundColor Green
}
Set-Location ..
Write-Host ""

# Configurar .env
Write-Host "5. Configurando variáveis de ambiente..." -ForegroundColor Yellow
if (-Not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  Arquivo .env criado. CONFIGURE-O antes de continuar!" -ForegroundColor Yellow
    Write-Host "   Abra backend\.env e preencha:" -ForegroundColor Yellow
    Write-Host "   - DB_PASSWORD" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET (32+ caracteres)" -ForegroundColor Yellow
    Write-Host "   - JWT_REFRESH_SECRET (32+ caracteres)" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione ENTER quando terminar de configurar o .env"
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}
Write-Host ""

# Ler credenciais do .env
Write-Host "6. Configurando banco de dados..." -ForegroundColor Yellow
$envContent = Get-Content "backend\.env" -Raw
$DB_HOST = ($envContent -match 'DB_HOST=(.*)' | Out-Null; $matches[1])
$DB_PORT = ($envContent -match 'DB_PORT=(.*)' | Out-Null; $matches[1])
$DB_USERNAME = ($envContent -match 'DB_USERNAME=(.*)' | Out-Null; $matches[1])
$DB_PASSWORD = ($envContent -match 'DB_PASSWORD=(.*)' | Out-Null; $matches[1])
$DB_DATABASE = ($envContent -match 'DB_DATABASE=(.*)' | Out-Null; $matches[1])

Write-Host "   Host: $DB_HOST:$DB_PORT"
Write-Host "   Database: $DB_DATABASE"
Write-Host ""

# Configurar PGPASSWORD
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "   Testando conexão..." -ForegroundColor Yellow
try {
    # Testar conexão
    $null = psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "SELECT 1" 2>&1
    Write-Host "✅ Conexão com PostgreSQL estabelecida" -ForegroundColor Green
    
    # Verificar se banco existe
    $dbExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_DATABASE'" 2>&1
    
    if ($dbExists -ne "1") {
        Write-Host "   Criando banco de dados $DB_DATABASE..." -ForegroundColor Yellow
        psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "CREATE DATABASE $DB_DATABASE" | Out-Null
        Write-Host "✅ Banco de dados criado" -ForegroundColor Green
    } else {
        Write-Host "✅ Banco de dados já existe" -ForegroundColor Green
    }
    
    # Executar migrations
    Write-Host "   Executando migrations..." -ForegroundColor Yellow
    psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f "backend\database\migrations\001_create_tables.sql" | Out-Null
    Write-Host "✅ Migrations executadas" -ForegroundColor Green
    
    # Executar seeds
    Write-Host "   Inserindo dados iniciais..." -ForegroundColor Yellow
    psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f "backend\database\seeds\001_initial_data.sql" | Out-Null
    Write-Host "✅ Seeds executados" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Não foi possível conectar ao PostgreSQL" -ForegroundColor Red
    Write-Host "   Verifique se o PostgreSQL está rodando:" -ForegroundColor Yellow
    Write-Host "   - Docker: docker-compose up -d postgres" -ForegroundColor Yellow
    Write-Host "   - Serviço Windows: services.msc -> PostgreSQL" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Compilar backend
Write-Host "7. Compilando backend..." -ForegroundColor Yellow
Set-Location backend
npm run build | Out-Null
Write-Host "✅ Backend compilado" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Instalar frontend (opcional)
$installFrontend = Read-Host "Deseja instalar o frontend também? (s/N)"
if ($installFrontend -eq 's' -or $installFrontend -eq 'S') {
    Write-Host "8. Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location frontend
    if (-Not (Test-Path "node_modules")) {
        npm install | Out-Null
        Write-Host "✅ Dependências do frontend instaladas" -ForegroundColor Green
    } else {
        Write-Host "✅ Dependências do frontend já instaladas" -ForegroundColor Green
    }
    
    # Configurar .env do frontend
    if (-Not (Test-Path ".env")) {
        @"
VITE_API_URL=http://localhost:3000/api
VITE_API_VERSION=v1
VITE_APP_NAME=JB Pinturas ERP
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ Arquivo .env do frontend criado" -ForegroundColor Green
    }
    Set-Location ..
    Write-Host ""
}

# Resumo
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Inicialização concluída!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Credenciais iniciais:" -ForegroundColor Cyan
Write-Host "   Email: admin@jbpinturas.com.br"
Write-Host "   Senha: Admin@2026"
Write-Host ""
Write-Host "🚀 Para iniciar o sistema:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend:"
Write-Host "   cd backend; npm run start:dev"
Write-Host "   Acesse: http://localhost:3000/api"
Write-Host "   Swagger: http://localhost:3000/api/docs"
Write-Host ""
if ($installFrontend -eq 's' -or $installFrontend -eq 'S') {
    Write-Host "   Frontend:"
    Write-Host "   cd frontend; npm run dev"
    Write-Host "   Acesse: http://localhost:5173"
    Write-Host ""
}
Write-Host "   Ou use Docker Compose:"
Write-Host "   docker-compose up -d"
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Altere a senha do admin após o primeiro login!" -ForegroundColor Yellow
Write-Host ""
