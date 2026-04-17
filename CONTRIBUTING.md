# 👨‍💻 Guia de Contribuição

Obrigado por considerar contribuir para o JB Pinturas! Este documento fornece diretrizes e instruções para contribuir com o projeto.

## 📋 Sumário

- [Código de Conduta](#código-de-conduta)
- [Como Começar](#como-começar)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Commits e PRs](#commits-e-prs)
- [Testing](#testing)
- [Documentação](#documentação)
- [Perguntas Frequentes](#perguntas-frequentes)

## 📜 Código de Conduta

Leia nosso [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Esperamos que todos os contribuidores sigam essas diretrizes.

## 🚀 Como Começar

### 1. Fork e Clone

```bash
# Fork no GitHub (botão no topo)

# Clone seu fork
git clone https://github.com/seu_username/jb_pinturas.git
cd jb_pinturas

# Adicione o original como upstream
git remote add upstream https://github.com/original_owner/jb_pinturas.git
```

### 2. Setup Local

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run migration:run
npm run seed
npm run start:dev

# Frontend (novo terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

# Mobile (novo terminal)
cd mobile
npm install
cp .env.example .env
npx react-native start
```

### 3. Crie uma Branch

```bash
# Atualize a main/develop
git fetch upstream
git checkout develop
git pull upstream develop

# Crie sua branch de feature
git checkout -b feature/descricao-curta
# ou para bugfixes:
git checkout -b bugfix/descricao-do-bug
# ou para documentação:
git checkout -b docs/descricao-da-doc
```

## 🔄 Processo de Desenvolvimento

### Branch Strategy

```
main (produção)
  │
  └─ develop (staging)
      │
      ├─ feature/nova-funcionalidade
      └─ bugfix/correcao-de-bug
```

### Workflow

1. **Crie a branch** a partir de `develop`
2. **Implemente mudanças**
3. **Rode testes localmente** (OBRIGATÓRIO)
4. **Commit com mensagem descritiva**
5. **Push para seu fork**
6. **Abra Pull Request** para `develop`
7. **Responda aos comentários** do review
8. **Merge automático** após aprovação

### Tipos de Contribution

- 🎨 **Feature**: Nova funcionalidade
- 🐛 **Bugfix**: Corrigir bug
- 📚 **Documentation**: Melhorar docs
- 🎯 **Refactoring**: Melhorar código existente
- ⚡ **Performance**: Otimizações
- 🧪 **Tests**: Melhorar cobertura de testes
- 🔒 **Security**: Correções de segurança

## 📝 Padrões de Código

### TypeScript

```typescript
// ✅ BOM
interface CreateUserDTO {
  nome: string;
  email: string;
  senha: string;
}

export class UsuariosService {
  constructor(private repository: UsuarioRepository) {}
  
  async create(dto: CreateUserDTO): Promise<Usuario> {
    // ...
  }
}

// ❌ RUIM
function createUser(data) {
  // ...
}
```

### NestJS Backend

```typescript
// DTO com validação
import { IsEmail, MinLength, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @MinLength(3)
  nome: string;
  
  @IsEmail()
  email: string;
  
  @MinLength(8)
  senha: string;
}

// Service (business logic)
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}
  
  async create(dto: CreateUserDTO): Promise<Usuario> {
    const usuario = new Usuario();
    usuario.nome = dto.nome;
    usuario.email = dto.email;
    usuario.senha_hash = await hash(dto.senha);
    return this.usuarioRepository.save(usuario);
  }
}

// Controller (rotas)
@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}
  
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateUserDTO) {
    return this.usuariosService.create(dto);
  }
}
```

### React / Frontend

```typescript
// ✅ BOM - Component com hooks
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchClientes, selectClientes } from '../store/slices/clientesSlice';

export function ClientesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector(selectClientes);
  
  useEffect(() => {
    dispatch(fetchClientes());
  }, [dispatch]);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  
  return (
    <Container>
      <DataGrid rows={items} columns={colunas} />
    </Container>
  );
}

// ❌ RUIM - Class component, no Redux
class ClientesPage extends React.Component {
  state = { clientes: [], loading: false };
  
  componentDidMount() {
    fetch('/api/clientes').then(res => {
      this.setState({ clientes: res.data });
    });
  }
  
  render() {
    return <div>{/* ... */}</div>;
  }
}
```

### React Native / Mobile

```typescript
// ✅ BOM - Functional component com hooks
import { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks';

export function RDOListScreen() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector(state => state.rdo);
  const isOffline = useOffline();
  
  useEffect(() => {
    dispatch(fetchRDOs());
  }, [dispatch]);
  
  return (
    <View style={styles.container}>
      {isOffline && <OfflineNotice />}
      <FlatList
        data={items}
        renderItem={({ item }) => <RDOCard rdo={item} />}
        keyExtractor={item => item.id}
        refreshing={loading}
      />
    </View>
  );
}
```

### Naming Conventions

```typescript
// Files
UsuariosService.ts      // PascalCase para classes
usuarios.service.ts     // kebab-case para arquivo
usuarios.utils.ts       // helpers/utilities
usuarios.types.ts       // type definitions

// Variables
const usuarioNovo = {};   // camelCase
let contadorTentativas;   // camelCase
const MAX_TENTATIVAS = 3; // SCREAMING_SNAKE_CASE para constantes

// Functions
function criarUsuario() {}        // camelCase, verbo no imperativo
const validarEmail = () => {};    // arrow function OK
```

### Code Style

```bash
# Verificar estilo
npm run lint

# Corrigir automaticamente
npm run lint -- --fix

# Verificar types
npm run type-check

# Formatar com Prettier
npm run format
```

## 💬 Commits e Pull Requests

### Mensagens de Commit (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Tipos
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças em documentação
- `style`: Formatação, missing semicolons, etc
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adicionar ou atualizar testes
- `ci`: Mudanças em CI/CD
- `chore`: Dependências, build scripts, etc

#### Exemplos

```bash
# ✅ BON
git commit -m "feat(auth): adicionar two-factor authentication"
git commit -m "fix(obras): corrigir filtro por status"
git commit -m "docs: atualizar README com instruções de setup"
git commit -m "refactor(usuarios): simplificar lógica de validação"
git commit -m "test(clientes): aumentar cobertura para 85%"

# ❌ RUIM
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "atualizações"
git commit -m "Merge branch 'develop'"
```

### Pull Request

#### Template PR

```markdown
## 📝 Descrição
Breve descrição das mudanças. O que foi feito e por quê?

## 🔗 Issue Relacionada
Fixes #123
Closes #456

## 🧪 Como Testar
Passos para validar as mudanças:
1. Ir para Settings
2. Clicar em "Save"
3. Verificar se funciona

## ✅ Checklist
- [ ] Código segue style guide
- [ ] Atualizei documentação
- [ ] Adicionei testes
- [ ] Testes passam localmente
- [ ] Sem console.logs em produção
- [ ] Sem breaking changes (ou documentado)

## 📸 Screenshots (se aplicável)
Se for mudança visual, adicionar screenshot.

## 🔄 Type de Mudança
- [ ] 🐛 Bugfix
- [ ] ✨ Feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentation
```

## 🧪 Testing

### Obrigatoriedade
- ✅ **Backend**: Min 80% coverage
- ✅ **Frontend**: Min 70% coverage (components críticos)
- ✅ **Mobile**: Min 60% coverage

### Rodar Testes

```bash
# Backend
cd backend
npm test                # Todos
npm test -- usuarios    # Específico
npm test:cov            # Com coverage report
npm test:e2e            # E2E tests

# Frontend (quando configurado)
cd frontend
npm run test
npm run test:cov

# Mobile (quando configurado)
cd mobile
npm test
```

### Exemplo Teste Backend

```typescript
describe('UsuariosService', () => {
  let service: UsuariosService;
  let repository: Repository<Usuario>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: 'UsuarioRepository',
          useValue: { create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();
    
    service = module.get(UsuariosService);
    repository = module.get('UsuarioRepository');
  });
  
  describe('create', () => {
    it('deve criar usuário com dados válidos', async () => {
      const dto = {
        nome: 'João',
        email: 'joao@test.com',
        senha: 'senha123',
      };
      
      jest.spyOn(repository, 'create').mockReturnValueOnce({
        ...dto,
        id_usuario: '1',
      });
      
      const result = await service.create(dto);
      
      expect(result.nome).toBe('João');
      expect(repository.create).toHaveBeenCalled();
    });
  });
});
```

## 📚 Documentação

### Quando Documentar
- ✅ Adicionar função pública
- ✅ Mudar comportamento existente
- ✅ Adicionar novo endpoint
- ✅ Mudar variáveis de ambiente
- ✅ Atualizar formato API

### Onde Documentar

1. **Swagger (Backend)**
```typescript
@ApiOperation({ summary: 'Criar novo usuário' })
@ApiBody({ type: CreateUserDTO })
@ApiResponse({ status: 201, type: Usuario })
@Post()
create(@Body() dto: CreateUserDTO) {
  return this.usuariosService.create(dto);
}
```

2. **JSDoc (Funções)**
```typescript
/**
 * Calcula margem de lucro por obra
 * @param idObra - ID da obra
 * @param periodo - 'mes' | 'trimestre' | 'ano'
 * @returns Margem percentual (0-100)
 * @throws {NotFoundException} Se obra não existir
 */
export async function calcularMargemLucro(
  idObra: string,
  periodo: 'mes' | 'trimestre' | 'ano'
): Promise<number> {
  // ...
}
```

3. **README.md Folders**
- backend/README.md
- frontend/README.md
- mobile/README.md
- docs/

4. **Issue/PR Description**
- Context (por quê essa mudança?)
- Changes (o quê foi mudado?)
- Testing (como testar?)

## ❓ Perguntas Frequentes

### P: Como faço fork?
**R**: Clique no botão "Fork" no topo do repositório GitHub.

### P: Como atualizo meu fork com upstream?
**R**:
```bash
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop
```

### P: Posso fazer commit direto em main?
**R**: **NÃO**. Todas as mudanças devem vir de PRs em `develop`. `main` só recebe merges do `release/*` ou `hotfix/*`.

### P: Como rodo testes antes de fazer PR?
**R**:
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run test:cov

# Mobile
cd mobile && npm test
```

### P: Erro ao fazer push - "permission denied"?
**R**: Verifique se está usando SSH keys. Ou use HTTPS com token:
```bash
git remote set-url origin https://token:x-oauth-basic@github.com/seu_username/jb_pinturas
```

### P: Como faço squash de commits?
**R**:
```bash
# Últimos 3 commits
git rebase -i HEAD~3
# Marcar como 'squash' ou 's' os que quer mesclar
```

### P: Posso fazer rebase em vez de merge?
**R**: **SIM**. É preferível:
```bash
git fetch upstream
git rebase upstream/develop
git push -f origin sua-branch
```

### P: Testes falhando - como debugar?
**R**:
```bash
npm test -- --verbose
npm test -- --coverage
npm test -- --detectOpenHandles
```

## 🎓 Recursos Úteis

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NestJS Docs](https://docs.nestjs.com)
- [React Docs](https://react.dev)
- [React Native Docs](https://reactnative.dev)
- [Redux Toolkit Docs](https://redux-toolkit.js.org)
- [Git Workflow](https://git-scm.com/book/en/v2)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 📞 Dúvidas?

- Abra uma [Discussion](https://github.com/seu_username/jb_pinturas/discussions)
- Leia documentação em [docs/](docs/)

---

**Obrigado por contribuir! 🎉**

Se sua contribution for aceita, você será adicionado à seção [CONTRIBUTORS.md](CONTRIBUTORS.md).
