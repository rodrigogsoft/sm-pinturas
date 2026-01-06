# Guia de Contribuição - JB Pinturas

## Como Contribuir

### 1. Setup Local

```bash
# Clone o repositório
git clone <seu-repo>
cd jb_pinturas

# Instale as dependências
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd mobile && npm install && cd ..
```

### 2. Crie uma Branch

```bash
# Sempre crie uma branch a partir de main ou develop
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-fix
# ou
git checkout -b docs/sua-documentacao
```

### 3. Nomenclatura de Branches

- `feature/*` - Nova funcionalidade
- `fix/*` - Correção de bug
- `docs/*` - Documentação
- `refactor/*` - Refatoração
- `test/*` - Testes
- `chore/*` - Manutenção

### 4. Commits

```bash
# Commit com mensagens claras e descritivas
git commit -m "feat: descrição da feature"
git commit -m "fix: descrição do bug corrigido"
git commit -m "docs: atualização da documentação"
git commit -m "refactor: melhorias no código"
git commit -m "test: adição de testes"
```

### 5. Mensagens de Commit

Siga o padrão Conventional Commits:

```
<type>(<scope>): <subject>
<body>
<footer>
```

**Types:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não altera lógica)
- `refactor`: Refatoração
- `perf`: Melhoria de performance
- `test`: Testes
- `chore`: Dependências, build, etc

**Exemplo:**
```
feat(auth): implementar autenticação JWT

- Adicionar estratégia JWT
- Criar guards de autenticação
- Implementar login e registro

Closes #123
```

### 6. Pull Request

1. Faça push da sua branch
```bash
git push origin feature/sua-feature
```

2. Abra um PR no GitHub/GitLab

3. Descreva:
   - O que foi alterado
   - Por que foi alterado
   - Como testar
   - Screenshots (se applicable)

4. Garanta que:
   - ✅ Testes passando
   - ✅ Sem conflitos
   - ✅ Código formatado
   - ✅ Documentação atualizada

### 7. Code Review

- Responda aos comentários
- Faça ajustes solicitados
- Após aprovação, merge será feito

## Padrões de Código

### Backend (NestJS)

**Estrutura de arquivo:**
```typescript
// feature.controller.ts
@Controller('features')
export class FeatureController {
  constructor(private featureService: FeatureService) {}

  @Get()
  findAll() {
    return this.featureService.findAll();
  }
}

// feature.service.ts
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private repo: Repository<Feature>,
  ) {}

  findAll() {
    return this.repo.find();
  }
}

// feature.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Feature])],
  controllers: [FeatureController],
  providers: [FeatureService],
})
export class FeatureModule {}
```

**DTOs:**
```typescript
// create-feature.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### Frontend (React)

**Estrutura de componente:**
```typescript
// FeatureComponent.tsx
import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  title: string;
  onAction?: () => void;
}

export const FeatureComponent: FC<Props> = ({ title, onAction }) => {
  return (
    <Box>
      <Typography variant="h5">{title}</Typography>
    </Box>
  );
};
```

**Custom Hook:**
```typescript
// useFeature.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './store';

export const useFeature = () => {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector(state => state.feature);

  const loadData = useCallback(() => {
    dispatch(fetchFeature());
  }, [dispatch]);

  return { data, loading, loadData };
};
```

### Mobile (React Native)

**Estrutura de tela:**
```typescript
// FeatureScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const FeatureScreen = () => {
  const navigation = useNavigation();

  return (
    <View>
      <Text>Feature Screen</Text>
    </View>
  );
};
```

## Testes

### Backend

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

**Exemplo de teste:**
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let repo: Repository<User>;

  beforeEach(async () => {
    // Setup
  });

  it('should login with valid credentials', async () => {
    const result = await service.login({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(result).toHaveProperty('access_token');
  });
});
```

### Frontend

```bash
npm test
```

### Mobile

```bash
npm test
```

## Documentação

- Documente novas funcionalidades em `/docs`
- Atualize README.md se necessário
- Adicione comentários para lógica complexa
- Mantenha JSDoc/TypeDoc atualizado

## Linting e Formatting

```bash
# Formatação automática
npm run format

# Linting
npm run lint

# Fix automático
npm run lint -- --fix
```

## Performance

- Evite renders desnecessários no React
- Use useMemo e useCallback apropriadamente
- Implemente paginação em listas grandes
- Cache dados quando possível
- Use indexes no banco de dados

## Segurança

- Nunca commite `.env` com dados sensíveis
- Valide inputs no backend
- Use HTTPS em produção
- Sanitize dados do usuário
- Implemente rate limiting
- Use autenticação forte (JWT, bcrypt)

## Processo de Review

1. **Automático**: CI/CD checks
2. **Manual**: Code review por 2+ pessoas
3. **Testes**: Verificar cobertura > 80%
4. **Merge**: Após aprovação e checks passando

## Dúvidas?

- Consulte a documentação em `/docs`
- Abra uma issue para discussão
- Entre em contato com a equipe

Obrigado por contribuir! 🎉
