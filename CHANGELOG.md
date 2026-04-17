# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [Sprint 3 - Completo] - 2026-02-10

### ✅ RF07 - Alocação Visual com Drag & Drop

#### Adicionado - Mobile
- **AlocacaoScreen** com drag-and-drop nativo
  - Biblioteca: react-native-drax@0.10.3 (DraxProvider, DraxView)
  - Feedback háptico: react-native-haptic-feedback@2.2.0
  - Lista de colaboradores disponíveis (draggable)
  - Grid de ambientes receptivos (drop zones)
  - Validação client-side (colaborador livre + ambiente disponível)
  - Indicadores visuais de status (cores: verde/livre, laranja/ocupado, azul/alocando)
  - Dashboard de estatísticas (colaboradores ativos, ambientes em uso, concluídas)
  - Lista de alocações ativas com botão "Concluir"
  - Modal de confirmação para conclusão
  - Pull-to-refresh para atualizar dados
- **AlocacoesService** completo
  - criar() com tratamento de conflitos (409)
  - listarAtivas() com filtro por sessão
  - obterEstatisticas() para dashboard
  - concluir() com observações opcionais
  - verificarAmbienteOcupado() para validações
- **SessoesService** completo
  - buscarSessaoAberta() por encarregado
  - criarSessao() com geolocalização
  - Validação de sessão única por obra
- **Integração ObrasScreen**
  - Botão "Alocar" em cada card de obra
  - Validação de sessão existente (bloqueia se sessão aberta em outra obra)
  - Navegação direta para Alocacao se sessão já existe
  - Criação automática de sessão com GPS se necessário

#### Adicionado - Backend
- **Módulo Alocacoes** completo
  - AlocacoesController com 5 endpoints
  - AlocacoesService com validações de negócio
  - Entity AlocacaoTarefa (id, id_sessao, id_colaborador, id_ambiente, status, data_inicio, data_conclusao)
  - Validação server-side: colaborador e ambiente únicos por sessão
  - Retorno 409 (Conflict) com detalhes do conflito
- **Módulo Sessoes** completo
  - SessoesController com 3 endpoints
  - SessoesService com validação de proximidade GPS
  - Entity SessaoDiaria (id, id_obra, id_encarregado, data, geo_lat, geo_long, status)
  - Endpoint buscarSessaoAberta() para verificar sessões ativas

#### Estatísticas
- Total de alocações
- Alocações em andamento
- Alocações concluídas
- Colaboradores ativos na sessão
- Ambientes em uso

### ✅ RF09 - Push Notifications com Firebase

#### Adicionado - Backend
- **PushNotificationService** (300+ linhas)
  - Inicialização Firebase Admin SDK
  - Suporte a FIREBASE_SERVICE_ACCOUNT_JSON (env var, produção)
  - Suporte a FIREBASE_SERVICE_ACCOUNT_PATH (arquivo, desenvolvimento)
  - enviarParaUsuario() com lookup de FCM token
  - enviarPush() com mensagens FCM completas
  - enviarParaUsuarios() para envio em lote
  - enviarNotificacaoSilenciosa() para sync em background
  - registrarToken() e removerToken() para lifecycle
  - obterEstatisticas() de registro de tokens
  - Mapeamento de prioridades (alta/normal/baixa)
  - Canais Android (medicoes, faturamento, aprovacoes, precos, geral)
  - Tratamento de tokens inválidos/expirados
- **PushController** com 4 endpoints
  - POST /push/register-token (registro no login)
  - POST /push/unregister-token (remoção no logout)
  - POST /push/test (envio de push de teste)
  - GET /push/stats (estatísticas de tokens)
- **Integração NotificacoesService**
  - enviarPushAsync() não-bloqueante no create()
  - enviarPushEmLote() no createEmLote()
  - Mapeamento automático de PrioridadeEnum
  - Não falha criação de notificação se push falhar
- **Migration 005** (`005_add_fcm_token.sql`)
  - Campo fcm_token VARCHAR(255) em tb_usuarios
  - Índice idx_usuarios_fcm_token (parcial, WHERE NOT NULL)

#### Adicionado - Mobile
- **PushService** (97 linhas)
  - initialize() com fluxo completo (permissão → token → registro → listener)
  - requestPermission() para Android/iOS
  - getToken() do Firebase SDK
  - registerToken() com AsyncStorage para evitar duplicatas
  - unregisterToken() no logout
  - listenTokenRefresh() para renovação automática de token
- **Integração AuthSlice**
  - loginAsync() chama PushService.initialize() após sucesso
  - restaurarSessaoAsync() chama PushService.initialize() na restauração
  - logoutAsync() chama PushService.unregisterToken() antes de logout
  - Wrapped em try-catch (não falha login se push falhar)
- **Background Message Handler** (App.tsx)
  - messaging().setBackgroundMessageHandler() registrado fora do componente
  - Log de mensagens recebidas em background

#### Configuração
- **firebase-admin** v12.0.0 (Backend)
- **@react-native-firebase/app** v19.2.2 (Mobile)
- **@react-native-firebase/messaging** v19.2.2 (Mobile)
- Guia completo: FIREBASE_SETUP.md (361 linhas)

#### Dependências
- Backend: 982 packages instalados
- Mobile: 1008 packages (com --legacy-peer-deps para resolver conflito React)

## [Sprint 2 - Completo] - 2026-02-10

### ✅ RF08 - UI de Excedentes

#### Adicionado
- **Página ExcedentesPage** com gestão completa de medições excedentes
  - Dashboard com 4 cards de estatísticas (gradientes coloridos)
  - Tabela completa com filtros (data, obra, colaborador)
  - Modal de detalhes com informações completas
  - Modal de foto para visualização de evidências
  - Cálculo automático de excedente (m² e %)
  - Indicadores visuais de status (justificativa, foto)
  - Alertas para excedentes sem documentação
- **MedicoesService** completo
  - Endpoint `listarExcedentes()` com filtros
  - Métodos CRUD completos
  - Tipagem TypeScript
- **Destaque Visual** em tabela
  - Background laranja para items sem justificativa
  - Chips warning com valores de excedente
  - Ícones de status (✓ justificativa, 📷 foto, ⚠ pendente)

#### Estatísticas
- Total de excedentes
- Área excedente total (m²)
- Percentual com justificativa
- Percentual com foto de evidência

### ✅ RF06 - RDO Digital com Geolocalização

#### Adicionado - Mobile
- **GeolocationService** completo
  - Gerenciamento de permissões (Android/iOS)
  - Captura de coordenadas GPS (alta precisão)
  - Cálculo de distância (fórmula de Haversine)
  - Validação de proximidade (tolerância 100m)
  - Formatação e validação de coordenadas
- **Integração RDOFormScreen**
  - handleCapturarLocalizacao() com validação automática
  - capturarSemValidacao() para obras sem GPS
  - Feedback visual: chips coloridos (verde/vermelho)
  - Bloqueio de criação se fora da área
  - Validação obrigatória antes de salvar
  - Hint sobre tolerância de 100m

#### Adicionado - Backend
- **Validação de Sessões** (sessoes.service.ts)
  - Método validarProximidade() com Haversine
  - Tolerância configurável (100m)
  - Erro descritivo: GEOLOCALIZACAO_OBRIGATORIA, FORA_DA_AREA_OBRA
  - Tratamento de obras sem coordenadas
- **Entity Obra** estendida
  - Campos: geo_lat (float), geo_long (float)
- **Migration 004** (`004_add_obra_geolocalizacao.sql`)
  - Adiciona geo_lat/geo_long em tb_obras
  - Índice otimizado para consultas espaciais

#### Modificado
- **mobile/src/screens/RDOFormScreen.tsx**: Estados proximidadeValida, distanciaObra, UI atualizada
- **backend/src/modules/sessoes/sessoes.module.ts**: Adiciona Obra ao TypeOrmModule
- **backend/database/init.sql**: tb_obras com campos de geolocalização

## [Sprint 1 - Completo] - 2026-02-10

### ✅ RF10 - Alertas de Faturamento

#### Adicionado
- **Módulo Jobs** com BullMQ para processamento assíncrono
  - `JobsModule` com configuração de filas
  - `AlertasFaturamentoService` com lógica de verificação de prazos
  - `AlertasFaturamentoProcessor` para processamento de jobs
- **Agendamento Automático** de job diário às 9h (cron: `0 9 * * *`)
- **Sistema de Notificações** integrado para alertas de faturamento
  - Notificações para Admin, Gestor e Financeiro
  - Priorização: ALTA (≤1 dia), MEDIA (2 dias)
  - Mensagens contextualizadas (HOJE, AMANHÃ, X dias)
- **Campos de Faturamento** em `tb_medicoes`:
  - `data_prevista_faturamento` (DATE)
  - `data_faturamento_realizado` (DATE)
  - `id_obra` (UUID) - denormalização para performance
- **Migration 003** (`003_add_faturamento_fields.sql`)
- **Índice Otimizado** para consultas de alertas não faturados
- **Relacionamento** Medicao → Obra para acesso direto
- **Logs Detalhados** de execução e monitoramento

#### Documentação
- `RF10_ALERTAS_FATURAMENTO.md` com especificação completa
- Atualizado `init.sql` com novos campos
- Atualizado `medicao.entity.ts` com campos e relacionamentos

### ✅ RN02 - Exceção Admin em Medições

#### Adicionado
- Validação de status de preço aprovado antes de criar medição
- Exceção para perfil Admin com justificativa obrigatória (min 20 caracteres)
- Integração com sistema de auditoria para log de exceções
- Campo `justificativa_excecao_admin` em `CreateMedicaoDto`

#### Modificado
- `MedicoesService.create()` agora aceita `usuario` com `id_perfil`
- Método `validarStatusPreco()` para navegação na cadeia de relacionamentos
- Erro customizado com código `PRECO_NAOAPROVADO`

### ✅ RF04 - Workflow de Preços

#### Adicionado
- Status `RASCUNHO` no enum `StatusAprovacaoEnum`
- Campo `margem_minima_percentual` em `tb_obras` (padrão: 20%)
- Campos de workflow em `tb_tabela_precos`:
  - `data_submissao`, `id_usuario_submissor`
  - `data_rejeicao`, `id_usuario_rejeitador`
  - `justificativa_rejeicao`
- Endpoint `PATCH /precos/:id/submeter` para submissão (Financeiro)
- Método `submeterParaAprovacao()` com validação de margem
- Método `aprovar()` separado para aprovação/rejeição
- Migration 002 (`002_add_preco_workflow.sql`)

#### Frontend
- **PrecosPage**: Card de estatística para RASCUNHOS, filtro por status
- **PrecosTable**: 
  - Botão "Submeter" para RASCUNHO/REJEITADO (Financeiro)
  - Botão "Avaliar" para PENDENTE (Gestor/Admin)
  - Exibição de margem mínima da obra
- **PrecoForm**: Validação dinâmica de margem baseada em obra
- **Hook usePrecos**: Método `submeter()` integrado
- **Service**: Endpoint `submeter()` e tipo `RASCUNHO`

### Em Desenvolvimento
- Estrutura inicial do projeto
- Configuração do ambiente de desenvolvimento

## [Unreleased - Anterior]

---

## [1.0.0] - TBD (MVP)

### Added (Adicionado)
#### Backend
- Sistema de autenticação JWT com MFA
- Módulo de gestão de obras (CRUD completo)
- Módulo de gestão de clientes
- Módulo de colaboradores
- Catálogo de serviços
- Sistema de precificação dual (Custo/Venda)
- Workflow de aprovação de preços
- RDO digital (Sessões Diárias)
- Sistema de alocação 1:1
- Medições com validação de excedentes
- Auditoria completa (logs imutáveis)
- Background jobs com BullMQ
- Cache com Redis
- Upload de fotos para S3

#### Frontend
- Tela de login com MFA
- Dashboard financeiro
- CRUD de obras
- CRUD de clientes
- CRUD de colaboradores
- Gestão de catálogo de serviços
- Interface de aprovação de preços
- Visualização de margens de lucro
- Relatórios e gráficos
- Modo escuro/claro

#### Mobile
- Login offline-first
- Sincronização delta
- RDO digital com geolocalização
- Captura de assinatura digital
- Alocação de tarefas
- Medição de produção
- Captura de fotos de evidência
- Justificativa de excedentes
- Notificações push

#### Infraestrutura
- Docker Compose para desenvolvimento
- CI/CD com GitHub Actions
- Deploy automatizado
- Migrations do banco de dados
- Backup automático

### Changed (Modificado)
- N/A (primeira versão)

### Deprecated (Descontinuado)
- N/A

### Removed (Removido)
- N/A

### Fixed (Corrigido)
- N/A

### Security (Segurança)
- Criptografia AES-256 para dados sensíveis
- TLS 1.2+ obrigatório
- MFA para perfis críticos
- RBAC implementado
- Rate limiting
- SQL injection protection (TypeORM)
- XSS protection (Helmet)

---

## [0.1.0] - 2026-02-06

### Added
- Estrutura inicial do projeto
- Configuração do monorepo
- Schema do banco de dados PostgreSQL
- Documentação completa (ERS v4.0)
- README e guias de contribuição
- Docker Compose configurado
- Workflows de CI/CD

---

## Tipos de Mudanças

- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas
- **Removed**: Funcionalidades removidas
- **Fixed**: Correções de bugs
- **Security**: Correções de vulnerabilidades

---

## Formato de Versão

Seguimos o [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

MAJOR: Mudanças incompatíveis na API
MINOR: Novas funcionalidades (compatíveis)
PATCH: Correções de bugs (compatíveis)
```

### Exemplos

- `1.0.0` → `2.0.0`: Breaking changes (ex: mudar estrutura da API)
- `1.0.0` → `1.1.0`: Nova funcionalidade (ex: adicionar endpoint)
- `1.0.0` → `1.0.1`: Bug fix (ex: corrigir validação)

---

## Links

[Unreleased]: https://github.com/jb-pinturas/erp-obras/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/jb-pinturas/erp-obras/releases/tag/v1.0.0
[0.1.0]: https://github.com/jb-pinturas/erp-obras/releases/tag/v0.1.0
