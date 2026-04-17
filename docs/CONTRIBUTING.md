# Guia de Contribuição

## 🤝 Como Contribuir

Ficamos felizes que você queira contribuir com o projeto ERP JB Pinturas! Este guia ajudará você a começar.

## 📋 Código de Conduta

* Seja respeitoso com todos os colaboradores
* Mantenha discussões técnicas e produtivas
* Reporte comportamentos inadequados ao líder do projeto

## 🔀 Fluxo de Trabalho (Git Flow)

### Branches

* `main` - Produção (protegida)
* `develop` - Desenvolvimento ativo
* `feature/*` - Novas funcionalidades
* `bugfix/*` - Correções de bugs
* `hotfix/*` - Correções urgentes em produção

### Como Criar uma Feature

```bash
# Atualizar develop
git checkout develop
git pull origin develop

# Criar branch da feature
git checkout -b feature/nome-da-feature

# Fazer commits
git add .
git commit -m "feat: descrição da mudança"

# Push e criar PR
git push origin feature/nome-da-feature
```

## 📝 Padrões de Commit (Conventional Commits)

Usamos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

* `feat`: Nova funcionalidade
* `fix`: Correção de bug
* `docs`: Documentação
* `style`: Formatação (não afeta código)
* `refactor`: Refatoração de código
* `test`: Adição ou correção de testes
* `chore`: Tarefas de manutenção

### Exemplos

```bash
feat(auth): adicionar autenticação JWT
fix(mobile): corrigir sincronização offline
docs(readme): atualizar instruções de instalação
refactor(api): simplificar controller de obras
test(obras): adicionar testes unitários
chore(deps): atualizar dependências
```

## 🏗️ Estrutura de um PR (Pull Request)

### Template de PR

```markdown
## Descrição
Breve descrição do que foi feito.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Build está passando
- [ ] Linters estão ok
```

## 💻 Padrões de Código

### TypeScript/JavaScript

* Usar TypeScript estrito
* Preferir `const` sobre `let`
* Usar arrow functions para callbacks
* Evitar `any` - usar tipos específicos

```typescript
// ❌ Ruim
function getData(id: any) {
  return fetch('/api/' + id);
}

// ✅ Bom
const getData = async (id: string): Promise<Data> => {
  const response = await fetch(`/api/${id}`);
  return response.json();
};
```

### Nomenclatura

* **Arquivos**: `kebab-case.ts`
* **Classes**: `PascalCase`
* **Funções/Variáveis**: `camelCase`
* **Constantes**: `UPPER_SNAKE_CASE`
* **Interfaces**: `IPascalCase` ou `PascalCase`

```typescript
// Bom exemplo
const API_BASE_URL = 'https://api.example.com';

class UserService {
  private readonly repository: IUserRepository;

  async findUserById(userId: string): Promise<User> {
    // implementação
  }
}
```

### Backend (NestJS)

* Um módulo por domínio
* DTOs para validação
* Guards para autenticação
* Interceptors para logging
* Usar Dependency Injection

```typescript
// obra.controller.ts
@Controller('obras')
@UseGuards(JwtAuthGuard)
export class ObraController {
  constructor(private readonly obraService: ObraService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ENCARREGADO', 'ADMIN')
  async create(@Body() dto: CreateObraDto) {
    return this.obraService.create(dto);
  }
}
```

### Frontend (React)

* Componentes funcionais com Hooks
* Separar lógica em custom hooks
* Props tipadas com TypeScript
* Usar Material UI para consistência

```typescript
// ObraCard.tsx
interface ObraCardProps {
  obra: Obra;
  onEdit: (id: string) => void;
}

export const ObraCard: React.FC<ObraCardProps> = ({ obra, onEdit }) => {
  const [loading, setLoading] = useState(false);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{obra.nome}</Typography>
        <Button onClick={() => onEdit(obra.id)}>
          Editar
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Mobile (React Native)

* Seguir padrões do Frontend
* Testar em iOS e Android
* Usar WatermelonDB para dados locais
* Implementar tratamento de offline

## 🧪 Testes

### Backend - Jest

```typescript
describe('ObraService', () => {
  let service: ObraService;
  let repository: Repository<Obra>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ObraService, mockRepository],
    }).compile();

    service = module.get<ObraService>(ObraService);
  });

  it('deve criar uma obra', async () => {
    const dto = { nome: 'Obra Teste' };
    const result = await service.create(dto);
    
    expect(result).toBeDefined();
    expect(result.nome).toBe(dto.nome);
  });
});
```

### Frontend - React Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('ObraCard', () => {
  it('deve chamar onEdit ao clicar no botão', () => {
    const mockEdit = jest.fn();
    render(<ObraCard obra={mockObra} onEdit={mockEdit} />);
    
    fireEvent.click(screen.getByText('Editar'));
    expect(mockEdit).toHaveBeenCalledWith(mockObra.id);
  });
});
```

## 📊 Cobertura de Testes

* Mínimo: 80% de cobertura
* Crítico (Financeiro): 95% de cobertura

```bash
# Backend
npm run test:cov

# Frontend
npm run test -- --coverage
```

## 🔍 Code Review

### O que revisar

* [ ] Código está limpo e legível
* [ ] Lógica está correta
* [ ] Testes cobrem os casos
* [ ] Sem código comentado/debug
* [ ] Sem secrets/credentials
* [ ] Performance é adequada
* [ ] Segurança foi considerada

### Checklist do Reviewer

* Ser construtivo nos comentários
* Aprovar quando estiver ok
* Solicitar mudanças se necessário
* Testar localmente se possível

## 🚀 Deploy

* Merges para `main` fazem deploy automático
* CI/CD valida testes e build
* Rollback disponível em caso de problemas

## 📚 Recursos

* [NestJS Docs](https://docs.nestjs.com/)
* [React Docs](https://react.dev/)
* [Material UI](https://mui.com/)
* [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 💬 Dúvidas?

Entre em contato:
* Tech Lead: [email]
* Slack: #jb-pinturas-dev
* Issues: GitHub Issues

---

**Obrigado por contribuir! 🎉**
