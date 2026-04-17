# Plano de Teste Automatizado — JB Pinturas ERP

**Data:** 31/03/2026  
**Objetivo:** fornecer um plano de teste detalhado e executável para validação de endpoints, páginas, menus, fluxos e funcionalidades do sistema, servindo de base para geração de scripts automatizados, checklist e relatórios por GitHub Copilot ou Cloud Code.

---

## 1. Escopo e stack de automação

### Ferramentas compatíveis com o projeto

| Camada | Ferramenta | Status no projeto | Uso recomendado |
|---|---|---:|---|
| Backend API | `Jest` + `Supertest` | ✅ | CRUD, auth, MFA, RBAC, fluxos financeiros |
| Frontend Web | `Vitest` + `Testing Library` | ✅ | componentes, páginas, formulários, estados |
| Web E2E | `Playwright` | ➕ recomendado | menus, navegação, páginas em branco, exportações |
| Mobile | `Jest` | ✅ | testes básicos de telas e serviços |
| API externa/smoke | `Newman` | ➕ opcional | coleção Postman e smoke por ambiente |
| Performance | `k6` | ➕ opcional | carga em dashboard e relatórios |

### Comandos úteis

```bash
# Backend
cd backend
npm run test
npm run test:e2e

# Frontend
cd frontend
npm test
npm run build

# Mobile
cd mobile
npm test
```

---

## 2. Matriz RBAC por perfil

Validar a visibilidade dos menus e o acesso às rotas conforme o menu real do sistema.

| Menu / Módulo | ADMIN | GESTOR | FINANCEIRO | ENCARREGADO |
|---|:---:|:---:|:---:|:---:|
| `Dashboard` | ✅ | ✅ | ✅ | ✅ |
| `Clientes` | ✅ | ✅ | ✅ | ❌ |
| `Colaboradores` | ✅ | ✅ | ❌ | ✅ |
| `Serviços` | ✅ | ✅ | ❌ | ❌ |
| `Preço` | ✅ | ✅ | ✅ | ❌ |
| `Obras` | ✅ | ✅ | ❌ | ✅ |
| `Pavimentos` | ✅ | ✅ | ❌ | ✅ |
| `Ambientes` | ✅ | ✅ | ❌ | ✅ |
| `Elementos de Serviço` | ✅ | ✅ | ❌ | ✅ |
| `O.S. / Sessões` | ✅ | ✅ | ❌ | ✅ |
| `Financeiro` | ✅ | ✅ | ✅ | ❌ |
| `Usuários` | ✅ | ❌ | ❌ | ❌ |
| `Auditoria` | ✅ | ✅ | ❌ | ❌ |
| `Permissões` | ✅ | ❌ | ❌ | ❌ |
| `Configurações` | ✅ | ❌ | ❌ | ❌ |

---

## 3. Estrutura recomendada de suites

```text
backend/test/e2e/
  auth.e2e-spec.ts
  rbac.e2e-spec.ts
  clientes.e2e-spec.ts
  obras.e2e-spec.ts
  precos-aprovacao.e2e-spec.ts
  financeiro-folha.e2e-spec.ts
  relatorios.e2e-spec.ts

frontend/src/tests/
  smoke-routes.test.tsx
  menu-rbac.test.tsx
  dashboard.test.tsx
  folha-individual.test.tsx
  produtividade.test.tsx

e2e/web/                # Playwright sugerido
  login.spec.ts
  menu-rbac.spec.ts
  crud-clientes.spec.ts
  fluxo-precos.spec.ts
  folha-individual.spec.ts
  dashboard-export.spec.ts
```

---

## 4. Casos de teste prioritários

## A. Autenticação, MFA e segurança

| ID | Alvo | Ação | Resultado esperado | Criticidade | Erro esperado |
|---|---|---|---|---|---|
| `AUTH-01` | `POST /auth/login` | Login com credenciais válidas | `200`, `access_token`, `user` | Alta | — |
| `AUTH-02` | `POST /auth/login` | Senha inválida | `401` | Alta | credenciais inválidas |
| `AUTH-03` | MFA/TOTP | Login de perfil com MFA e validação do código | sucesso apenas com TOTP válido | Alta | código inválido/expirado |
| `AUTH-04` | Endpoints protegidos | Chamar sem JWT | `401` | Alta | unauthorized |
| `AUTH-05` | RBAC | Usuário sem permissão acessar rota protegida | `403` | Alta | forbidden |
| `AUTH-06` | Logout / sessões | Encerrar sessão atual e outras sessões | sessão invalidada | Média | sessão não encontrada |

---

## B. Smoke de páginas, menus e navegação

| ID | Página/rota | Ação | Resultado esperado | Criticidade | Falha a capturar |
|---|---|---|---|---|---|
| `WEB-01` | todas as rotas autenticadas | abrir cada página | sem tela branca, sem crash JS | Alta | página em branco |
| `WEB-02` | `Layout` | validar menu por perfil | só aparecem menus permitidos | Alta | menu visível indevidamente |
| `WEB-03` | submenus de `Obras` | abrir `Pavimentos`, `Ambientes`, `Elementos`, `O.S.` | navegação correta | Alta | rota errada/sem dados |
| `WEB-04` | topo do sistema | testar `Sessões ativas`, `Sair`, download APK, alto contraste | ação funcional | Média | botão sem efeito |

---

## C. CRUDs principais

| ID | Módulo | Ação | Resultado esperado | Criticidade | Erro esperado |
|---|---|---|---|---|---|
| `CRUD-CLI-01` | `Clientes` | criar, editar, excluir, excluir em lote | operações persistidas | Alta | `400`, `409`, validação |
| `CRUD-COL-01` | `Colaboradores` | criar, editar, excluir, lote | tabela atualiza corretamente | Alta | CPF duplicado |
| `CRUD-SRV-01` | `Serviços` | CRUD catálogo global | listagem consistente | Média | unidade inválida |
| `CRUD-OBR-01` | `Obras` | criar obra | `201` e listagem atualizada | Alta | campos obrigatórios |
| `CRUD-PAV-01` | `Pavimentos` | criar/editar/excluir pavimento | vínculo com obra mantido | Média | obra ausente |
| `CRUD-AMB-01` | `Ambientes` | criar/editar/excluir ambiente | vínculo hierárquico válido | Média | pavimento inválido |
| `CRUD-ITE-01` | `Itens de Ambiente` | criar e listar elemento de serviço | item aparece no contexto correto | Alta | preço/serviço ausente |

---

## D. Fluxos críticos de negócio

| ID | Fluxo | Ação | Resultado esperado | Criticidade | Erro esperado |
|---|---|---|---|---|---|
| `PRECO-01` | `Preço` | criar preço em rascunho/pendente | status correto | Alta | margem/validação |
| `PRECO-02` | aprovação de preço | gestor aprova/rejeita | transição de status e feedback visual | Alta | `403` para perfil indevido |
| `OS-01` | `O.S. / Sessões` | abrir sessão, listar, detalhar, encerrar | ciclo operacional completo | Alta | sessão duplicada |
| `ALOC-01` | `Alocação` | alocar colaborador em obra/item/ambiente | vínculo criado | Alta | conflito operacional |
| `MED-01` | `Medições` | registrar medição válida | valor e status persistidos | Alta | `400` |
| `MED-02` | excedente | medir acima do permitido sem justificativa/foto | bloqueio da operação | Alta | erro de validação |
| `MED-03` | excedente válido | enviar com justificativa e evidência | sucesso com flag de excedente | Alta | upload ausente |

---

## E. Financeiro e folha

| ID | Página/endpoint | Ação | Resultado esperado | Criticidade | Erro esperado |
|---|---|---|---|---|---|
| `FIN-01` | `Financeiro` | abrir módulo e cards internos | todos os cards carregam sem crash | Alta | tela branca |
| `FIN-02` | `Contas a Pagar` | carregar lotes e filtros | dados corretos | Média | lista vazia indevida |
| `FIN-03` | `Contas a Receber` | filtrar medições em aberto | totais coerentes | Média | valor zerado |
| `FIN-04` | `Folha Individual` | aplicar filtros por data/colaborador/lote/obra | tabela e cards atualizados | Alta | filtro sem efeito |
| `FIN-05` | `Folha Individual` | fechar período | medições vão para `LOTE_CRIADO` e lotes são gerados | Alta | período inválido |
| `FIN-06` | `Folha Individual` | reabrir período | medições voltam para `ABERTO` | Alta | nenhum item encontrado |
| `FIN-07` | `Folha Individual` | exportar CSV | arquivo gerado com conteúdo correto | Média | blob vazio |
| `FIN-08` | `Vales` | abrir preview de descontos por lote | modal com bruto/desconto/líquido | Alta | lote não informado |
| `FIN-09` | `Apropriação Detalhada` | filtrar por período/obra/colaborador | valor apropriado = `qtd * preco_venda` | Alta | cálculo inconsistente |

---

## F. Relatórios e exportações

| ID | Relatório | Ação | Resultado esperado | Criticidade | Erro esperado |
|---|---|---|---|---|---|
| `REL-01` | `Dashboard` | abrir com período `dia/semana/mês/ano` | cards e drill-down atualizam | Alta | KPIs incorretos |
| `REL-02` | `Dashboard` | exportar `CSV`, `Excel`, `PDF` | downloads válidos | Média | arquivo corrompido |
| `REL-03` | `Produtividade` | carregar e filtrar | tabela sem crash e sem `undefined` | Alta | página em branco |
| `REL-04` | `Medições` | filtrar por status/período | resultados corretos | Média | totais divergentes |
| `REL-05` | `Margem` | abrir e listar por obra | margem calculada corretamente | Média | zero indevido |

---

## G. Administração, permissões e auditoria

| ID | Módulo | Ação | Resultado esperado | Criticidade | Erro esperado |
|---|---|---|---|---|---|
| `ADM-01` | `Usuários` | CRUD de usuário e troca de perfil | persistência e RBAC refletidos | Alta | `403`, duplicidade |
| `ADM-02` | `Permissões` | ativar/desativar módulos | menu responde à permissão granular | Alta | permissão não aplicada |
| `ADM-03` | `Configurações` | alterar configuração global | valor salvo e refletido no sistema | Média | erro de validação |
| `AUD-01` | `Auditoria` | executar ação sensível e consultar log | evento aparece no histórico | Alta | ausência de log |

---

## H. Negativos, segurança e robustez

| ID | Cenário | Ação | Resultado esperado | Criticidade |
|---|---|---|---|---|
| `NEG-01` | campos obrigatórios | enviar formulário incompleto | bloqueio com mensagem clara | Alta |
| `NEG-02` | dados nulos | backend retorna campo ausente | frontend não quebra | Alta |
| `SEC-01` | SQL Injection | enviar payload malicioso em filtros | sem execução indevida, `400/422` | Alta |
| `SEC-02` | XSS | inserir HTML/JS em campos textuais | conteúdo tratado com segurança | Alta |
| `SEC-03` | acesso direto por URL | perfil sem permissão abrir rota manualmente | bloqueio por RBAC | Alta |

---

## I. Performance mínima esperada

| ID | Cenário | Meta |
|---|---|---|
| `PERF-01` | carregar `Dashboard` com base populada | até **2–3s** |
| `PERF-02` | abrir relatórios financeiros com paginação | até **3s** |
| `PERF-03` | filtros de `Folha Individual` e `Apropriação` | até **2s** |
| `PERF-04` | exportação CSV | iniciar download em até **5s** |

---

## 5. Formato padrão para geração automática de scripts

Use este modelo por caso de teste:

```yaml
id: FIN-05
camada: api+ui
modulo: Folha Individual
alvo:
  pagina: /financeiro/folha-individual
  endpoint: POST /financeiro/folha-individual/fechar-periodo
precondicoes:
  - usuário autenticado com perfil FINANCEIRO
  - medições abertas no período
acao:
  - informar data_inicio e data_fim
  - clicar em "Fechar período"
resultado_esperado:
  - status HTTP 201/200
  - mensagem de sucesso
  - medições mudam para LOTE_CRIADO
  - lotes gerados por colaborador
criticidade: Alta
erros_esperados:
  - período inválido
  - nenhuma medição aberta encontrada
```

---

## 6. Priorização de execução

### P0 — bloquear release
- `AUTH-*`
- `WEB-01`
- `WEB-02`
- `PRECO-*`
- `ALOC-01`
- `MED-01`, `MED-02`, `MED-03`
- `FIN-04`, `FIN-05`, `FIN-06`
- `REL-03`
- `ADM-02`
- `AUD-01`

### P1 — regressão importante
- CRUDs completos
- relatórios/exportações
- sessões ativas / logout
- acessibilidade e alto contraste

### P2 — qualidade contínua
- carga/performance
- segurança ampliada
- mobile E2E mais profundo

---

## 7. Resultado esperado de cada execução

Cada teste automatizado deve registrar:

1. `caso/teste`
2. `módulo alvo`
3. `resultado`
4. `evidência` (`screenshot`, `response body`, `csv`, `trace`)
5. `criticidade`
6. `erro encontrado`
7. `status final`: `PASS`, `FAIL`, `BLOCKED`

---

## 8. Próximo passo sugerido

A partir deste plano, o próximo incremento pode ser:

1. gerar testes `backend/test:e2e` para auth, RBAC, preços e folha individual;
2. gerar testes `frontend` para smoke de rotas, menu RBAC e relatórios;
3. criar uma suíte `Playwright` para validação de navegação real no navegador.
