# Troubleshooting - JB Pinturas

## 🔧 Problemas Comuns

### Instalação

#### Porta 3000/3001 já em uso

**Problema**: Erro `EADDRINUSE: address already in use :::3000`

**Solução**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Ou usar porta diferente
API_PORT=3002 npm run start:dev
```

#### PostgreSQL não conecta

**Problema**: Erro `connect ECONNREFUSED 127.0.0.1:5432`

**Solução**:
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
brew services list                # macOS
services.msc                      # Windows

# Iniciar PostgreSQL
sudo systemctl start postgresql
brew services start postgresql
net start postgresql-x64-14

# Verificar credenciais no .env
cat backend/.env | grep DATABASE
```

#### node_modules corrompido

**Problema**: Erros estranhos após instalação

**Solução**:
```bash
# Limpar tudo
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Ou usar clean install
npm ci
```

### Desenvolvimento

#### TypeScript errors

**Problema**: Erros de tipo não encontrados

**Solução**:
```bash
# Recompile
npm run build

# Limpar cache
rm -rf dist/
npm run build

# VSCode: Reload window (Cmd+Shift+P > Reload Window)
```

#### Migrations falhando

**Problema**: Erro ao executar migrations

**Solução**:
```bash
# Ver status
npm run migration:list

# Reverter última
npm run migration:revert

# Verificar database
psql -U postgres -d jb_pinturas
SELECT * FROM typeorm_metadata;

# Reset database (CUIDADO!)
npm run typeorm schema:drop
npm run typeorm migration:run
```

#### Hot reload não funciona

**Problema**: Alterações em arquivos não recarregam

**Solução**:
```bash
# Parar e reiniciar
npm run start:dev

# Se usando Docker
docker-compose restart api

# Verificar volumes em docker-compose.yml
volumes:
  - ./backend:/app
  - /app/node_modules
```

### Testes

#### Testes falhando aleatoriamente

**Problema**: Testes intermitentes

**Solução**:
```bash
# Executar novamente
npm run test -- --detectOpenHandles

# Aumentar timeout
npm run test -- --testTimeout=10000

# Executar em série
npm run test -- --runInBand
```

#### Coverage muito baixo

**Problema**: Cobertura de testes < 80%

**Solução**:
```bash
# Ver detalhes
npm run test:cov

# Adicionar testes para arquivos não cobertos
# coverage/lcov-report/index.html mostra quais linhas

# Executar apenas testes de um arquivo
npm run test -- auth.service.spec.ts
```

### Frontend

#### React não renderiza

**Problema**: Página branca, nada aparece

**Solução**:
```bash
# Verificar console (F12)
# Limpar cache
rm -rf node_modules .cache
npm install

# Reset create-react-app
npm run start -- --reset-cache

# Verificar porta
BROWSER=none npm start
```

#### Componentes não atualizam

**Problema**: Estado não atualiza após ação

**Solução**:
```typescript
// Não fazer mutações diretas
const [state, setState] = useState({});
state.prop = value;  // ❌ Errado

// Criar novo objeto
setState({ ...state, prop: value });  // ✅ Correto
```

#### CSS não aplica

**Problema**: Estilos Material UI não aparecem

**Solução**:
```bash
# Verificar import
import { Box, Typography } from '@mui/material';

# Reinstalar dependencies
npm install @mui/material @emotion/react @emotion/styled

# Limpar cache
npm run start -- --reset-cache
```

### Mobile

#### Emulador Android não inicia

**Problema**: `error: device offline` ou não aparece

**Solução**:
```bash
# Listar devices
adb devices -l

# Reiniciar adb
adb kill-server
adb start-server

# Reiniciar emulador
# In Android Studio: Tools > AVD Manager > Restart

# Usar device físico
adb devices
adb reverse tcp:8081 tcp:8081
npm run android
```

#### Metro bundler crash

**Problema**: `Error: watch ENOSPC`

**Solução**:
```bash
# Aumentar watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Ou limpar cache
npm start -- --reset-cache

# Ou matar processo
pkill -f "react-native"
npm start
```

#### Build APK falha

**Problema**: Erro durante build do APK

**Solução**:
```bash
# Limpar gradle
cd android
./gradlew clean
cd ..

# Rebuildar
npm run build:apk

# Ou em modo debug
npx react-native run-android --verbose
```

### Backend

#### Database locked

**Problema**: Erro `database is locked`

**Solução**:
```bash
# Resetar conexões
psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) 
FROM pg_stat_activity 
WHERE datname = 'jb_pinturas' AND pid <> pg_backend_pid();"

# Ou parar tudo
docker-compose restart postgres
```

#### JWT token inválido

**Problema**: `Invalid token` ou `Token expired`

**Solução**:
```bash
# Gerar novo token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}'

# Verificar JWT_SECRET em .env
cat backend/.env | grep JWT_SECRET

# Verificar expiração
npm run test -- auth.service.spec.ts
```

#### N+1 queries

**Problema**: Muitas queries ao banco (performance ruim)

**Solução**:
```typescript
// Usar relations no find
const works = await workRepository.find({
  relations: ['client', 'measurements'],
  where: { status: 'in_progress' }
});

// Usar select específico
const works = await workRepository.find({
  select: ['id', 'name', 'status'],
  where: { status: 'in_progress' }
});

// Usar query builder para queries complexas
const works = await workRepository
  .createQueryBuilder('work')
  .leftJoinAndSelect('work.measurements', 'measurement')
  .where('work.status = :status', { status: 'in_progress' })
  .getMany();
```

### Docker

#### Container não inicia

**Problema**: `docker-compose up` falha

**Solução**:
```bash
# Ver logs
docker-compose logs -f

# Verificar compose file
docker-compose config

# Reconstruir
docker-compose build --no-cache

# Parar e limpar
docker-compose down
docker system prune -a
docker-compose up
```

#### Volume permissions

**Problema**: Erro de permissão no volume

**Solução**:
```bash
# Verificar ownership
ls -la backend/

# Mudar permissões
sudo chown -R $USER:$USER backend/
sudo chown -R $USER:$USER frontend/

# Ou usar docker user
docker run -u 1000:1000 ...
```

### Git

#### Merge conflicts

**Problema**: Conflito ao fazer pull

**Solução**:
```bash
# Ver conflitos
git status

# Editar arquivo e resolver

# Adicionar e commitar
git add .
git commit -m "fix: resolve merge conflicts"

# Ou abortar
git merge --abort
```

#### Commits com erro

**Problema**: Commit foi para branch errada

**Solução**:
```bash
# Desfazer último commit
git reset --soft HEAD~1

# Mudar de branch
git checkout -b correct-branch

# Refazer commit
git add .
git commit -m "message"

# Force push (cuidado!)
git push origin correct-branch -f
```

### Performance

#### Aplicação lenta

**Problema**: Resposta lenta, CPU/Memória alta

**Solução**:
```bash
# Perfil Node.js
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Monitorar processo
top
htop
ps aux | grep node

# Aumentar memory
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Verificar memory leak
npm install -g clinic
clinic doctor -- npm start
```

#### Build lento

**Problema**: Build demora muito

**Solução**:
```bash
# Análise do webpack
npm run build -- --profile

# Usar source maps apenas em dev
webpack.config.js: {
  devtool: isDev ? 'source-map' : false
}

# Lazy load components
const LazyComponent = React.lazy(() => import('./Component'));
```

### Debugging

#### Adicionar logs

**Backend**:
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private logger = new Logger(MyService.name);

  myMethod() {
    this.logger.debug('Debug message');
    this.logger.log('Info message');
    this.logger.warn('Warning message');
    this.logger.error('Error message');
  }
}
```

**Frontend**:
```typescript
console.log('Debug:', value);
console.warn('Warning:', value);
console.error('Error:', value);
```

#### Debugger

**Backend (VSCode)**:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

**Frontend (Chrome DevTools)**:
```
Sources > Breakpoints > Set breakpoint > Step through
```

## 📞 Escalation

Se o problema persistir:

1. **Logs**: Coleta logs completos
2. **Reprodução**: Forneça passos para reproduzir
3. **Contexto**: Qual OS, versão Node, etc?
4. **Screenshots**: Capture erros e comportamentos
5. **GitHub Issue**: Abra issue com detalhes

## 📚 Resources

- [NestJS Docs](https://docs.nestjs.com)
- [React Docs](https://react.dev)
- [React Native Docs](https://reactnative.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Docker Docs](https://docs.docker.com)

## 🆘 SOS Rápido

```bash
# Nuclear option - reset everything
docker-compose down -v
rm -rf backend/node_modules backend/dist
rm -rf frontend/node_modules frontend/build
rm -rf mobile/node_modules
rm -f backend/.env frontend/.env mobile/.env
rm -rf .git/index.lock

# Recomeçar
git status
docker-compose up
npm install
npm run start:dev
```

---

**Última atualização**: 5 de Janeiro de 2026
**Versão**: 1.0
