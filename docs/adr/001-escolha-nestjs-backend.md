# ADR-001: Escolha do NestJS para Backend

## Status

✅ **Aceito** - 06 de Fevereiro de 2026

## Contexto

Precisamos escolher um framework backend que atenda aos seguintes requisitos:

- **TypeScript nativo**: Para tipagem forte e melhor manutenibilidade
- **Arquitetura modular**: Para facilitar escalabilidade e testes
- **Suporte a microserviços**: Possível expansão futura
- **Boa documentação**: Para acelerar onboarding de desenvolvedores
- **Comunidade ativa**: Para suporte e bibliotecas
- **Performance adequada**: Para atender 100+ requisições/segundo
- **DI (Dependency Injection)**: Para melhor testabilidade

## Decisão

**Escolhemos NestJS** como framework backend principal.

### Justificativa

1. **TypeScript-first**: Totalmente em TypeScript, sem conversões
2. **Arquitetura inspirada em Angular**: Estrutura modular clara
3. **Decorators**: Código expressivo e declarativo
4. **Built-in Support**:
   - TypeORM / Prisma
   - GraphQL
   - WebSockets
   - Microservices
   - Swagger
   - Testing (Jest)
5. **CLI Poderoso**: Geração automática de código
6. **Ecossistema rico**: Integração fácil com bibliotecas populares

## Consequências

### Positivas ✅

- **Produtividade**: CLI e estrutura clara aceleram desenvolvimento
- **Manutenibilidade**: Código organizado e fácil de entender
- **Testabilidade**: DI facilita mocking e testes unitários
- **Escalabilidade**: Arquitetura modular permite crescimento organizado
- **Documentação automática**: Swagger integrado
- **Onboarding rápido**: Desenvolvedores Angular/TypeScript se adaptam facilmente
- **Performance**: Comparável a Express puro (overhead mínimo)
- **Comunidade**: 60k+ stars no GitHub, muito ativa

### Negativas ⚠️

- **Curva de aprendizado**: Para desenvolvedores não familiarizados com decorators
- **Vendor lock-in**: Migrar para outro framework seria custoso
- **Overhead**: Ligeiramente mais pesado que Express puro (aceitável)
- **Abstração**: Pode esconder detalhes de implementação

### Riscos Mitigados 🛡️

- **Performance**: Benchmarks mostram que é adequado para nossa escala
- **Manutenção**: Framework mantido pela Trilon (empresa dedicada)
- **Contratação**: TypeScript é cada vez mais popular

## Alternativas Consideradas

### 1. Express.js Puro

**Prós:**
- Leve e minimalista
- Controle total
- Comunidade massiva

**Contras:**
- ❌ Sem estrutura opinativa
- ❌ Requer muito boilerplate
- ❌ Difícil manter consistência em equipe

**Por que não:** Falta de estrutura dificulta manutenção em projetos grandes.

### 2. Fastify

**Prós:**
- Mais rápido que Express
- Plugin system moderno
- Validação JSON schema embutida

**Contras:**
- ❌ Menos opiniões sobre estrutura
- ❌ Comunidade menor que NestJS
- ❌ Menos integrado com TypeScript

**Por que não:** Requer mais código custom para arquitetura modular.

### 3. AdonisJS

**Prós:**
- Framework full-featured (como Laravel)
- CLI poderoso
- TypeScript suportado

**Contras:**
- ❌ Comunidade menor
- ❌ Menos maduro que NestJS
- ❌ Menos recursos para microservices

**Por que não:** Menos recursos para expansão futura para microserviços.

### 4. Koa.js

**Prós:**
- Moderno (async/await nativo)
- Leve
- Mantido por equipe Express

**Contras:**
- ❌ Minimalista demais
- ❌ Requer muitos middlewares customizados
- ❌ Sem TypeScript nativo

**Por que não:** Similar ao Express, falta estrutura.

## Implementação

### Estrutura de Módulos

```
src/
├── modules/
│   ├── auth/
│   ├── obras/
│   ├── clientes/
│   └── ...
├── common/
│   ├── decorators/
│   ├── guards/
│   └── interceptors/
└── config/
```

### Exemplos de Uso

```typescript
// Controller
@Controller('obras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Get()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.ADMIN)
  findAll() {
    return this.obrasService.findAll();
  }
}

// Service
@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
  ) {}

  async findAll(): Promise<Obra[]> {
    return this.obraRepository.find();
  }
}
```

## Métricas de Sucesso

- ✅ Tempo de desenvolvimento reduzido em 30% vs Express puro
- ✅ Cobertura de testes > 80%
- ✅ Onboarding de novos devs < 1 semana
- ✅ Performance: < 200ms (P95) para APIs

## Referências

- [NestJS Official Docs](https://docs.nestjs.com/)
- [NestJS GitHub](https://github.com/nestjs/nest)
- [NestJS vs Express Benchmark](https://github.com/nestjs/nest/issues/1024)
- [TypeScript Framework Comparison](https://2020.stateofjs.com/en-US/technologies/back-end-frameworks/)

## Aprovadores

- [x] Tech Lead
- [x] Arquiteto de Software
- [x] Backend Team

---

**Data de Criação:** 06/02/2026  
**Última Revisão:** 06/02/2026  
**Autor:** Tech Lead
