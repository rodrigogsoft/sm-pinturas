# ✅ CHECKLIST EXECUTÁVEL - Implementação ERS 4.0

**Uso:** Marque com `[x]` conforme concluir cada item  
**Atualização:** Última modificação em 10/02/2026

---

## 🎯 SPRINT 1: Workflows Financeiros (10-21 Fev)

### RF04 - Workflow de Aprovação de Preços

#### Backend (12h)
- [ ] Criar migration SQL (adicionar colunas de workflow + margem_minima em obras)
- [ ] Implementar `submeterParaAprovacao()` em `precos.service.ts`
- [ ] Implementar `aprovar()` em `precos.service.ts`
- [ ] Implementar `rejeitar()` em `precos.service.ts`
- [ ] Criar DTOs: `SubmeterPrecoDto`, `AprovarPrecoDto`, `RejeitarPrecoDto`
- [ ] Adicionar endpoints: `PATCH /precos/:id/submeter`, `/aprovar`, `/rejeitar`
- [ ] Atualizar Swagger documentation
- [ ] Criar testes unitários (service)
- [ ] Criar teste E2E (fluxo completo RASCUNHO → APROVADO → REJEITADO)

#### Frontend (8h)
- [ ] Criar `AprovacaoPrecoModal.tsx`
- [ ] Integrar modal na `PrecosPage.tsx`
- [ ] Adicionar coluna "Ações" na tabela de preços
- [ ] Implementar lógica de exibição condicional (RASCUNHO/PENDENTE/APROVADO)
- [ ] Adicionar validação de margem visual (semáforo verde/amarelo/vermelho)
- [ ] Criar toast de feedback (sucesso/erro)
- [ ] Testar responsividade mobile

---

### RN02 - Exceção Admin para Medições (2h)

#### Backend
- [ ] Modificar `medicoes.service.ts` - método `create()`
- [ ] Adicionar campo `justificativa_excecao_admin` no DTO
- [ ] Implementar lógica: Admin pode forçar se justificativa >= 20 chars
- [ ] Registrar exceção em `tb_audit_logs` com flag especial
- [ ] Criar teste E2E: Admin com justificativa (sucesso)
- [ ] Criar teste E2E: Admin sem justificativa (erro)
- [ ] Criar teste E2E: Encarregado tenta forçar (erro 403)

---

### RF10 - Alertas de Faturamento (6h)

#### Backend
- [ ] Instalar `@nestjs/schedule`: `npm install @nestjs/schedule`
- [ ] Criar `alertas-faturamento.processor.ts`
- [ ] Criar `faturamento.scheduler.ts` (cron diário 06:00)
- [ ] Registrar queue no `financeiro.module.ts`
- [ ] Implementar `calcularDiasParaCorte()` (lógica de mês)
- [ ] Implementar `calcularValorTotal()` das medições
- [ ] Criar endpoint `GET /relatorios/medicoes-pendentes/:id_cliente`
- [ ] Configurar Dead Letter Queue (3 retries)
- [ ] Testar job manualmente: `POST /dev/trigger-job/alertas-faturamento`
- [ ] Validar notificações geradas

---

## 🎯 SPRINT 2: RDO Digital (24 Fev - 7 Mar)

### RF06 - RDO Digital com Geolocalização (20h)

#### Mobile - Setup (2h)
- [ ] Instalar deps: `npm install @react-native-community/geolocation react-native-maps react-native-signature-canvas`
- [ ] Configurar permissões Android: `android/app/src/main/AndroidManifest.xml`
- [ ] Configurar permissões iOS: `ios/JBPinturas/Info.plist`
- [ ] Rodar `cd ios && pod install`

#### Mobile - Geolocalização (6h)
- [ ] Criar `geolocation.service.ts`
- [ ] Implementar `requestPermission()`
- [ ] Implementar `getCurrentPosition()`
- [ ] Implementar `calcularDistancia()` (Haversine)
- [ ] Implementar `validarProximidade()` (±50m)
- [ ] Criar `AbrirRDOScreen.tsx`
- [ ] Integrar MapView com marcadores (obra + usuário)
- [ ] Adicionar card de validação de proximidade (verde/vermelho)
- [ ] Testar em dispositivo físico (GPS real)

#### Mobile - Assinatura (4h)
- [ ] Criar `AssinaturaCanvas.tsx`
- [ ] Integrar `react-native-signature-canvas`
- [ ] Implementar conversão para base64
- [ ] Criar botão "Limpar" assinatura
- [ ] Testar captura em diferentes tamanhos de tela

#### Mobile - Encerramento (4h)
- [ ] Criar `EncerrarRDOScreen.tsx`
- [ ] Criar campo de observações
- [ ] Integrar canvas de assinatura
- [ ] Implementar upload de assinatura (S3 ou similar)
- [ ] Implementar `SessoesService.encerrarSessao()`
- [ ] Adicionar validação: assinatura obrigatória
- [ ] Testar fluxo completo: Abrir → Trabalhar → Encerrar

#### Backend (4h)
- [ ] Validar que campo `geo_lat`, `geo_long`, `assinatura_url` existem em `tb_sessoes_diarias`
- [ ] Validar endpoint `POST /sessoes` aceita geolocalização
- [ ] Validar endpoint `PATCH /sessoes/:id/encerrar` aceita assinatura_url
- [ ] Criar regra: 1 sessão aberta por encarregado/dia (soft constraint)

---

### RF08 - UI de Excedentes (8h)

#### Mobile
- [ ] Criar `MedicaoExcedenteModal.tsx`
- [ ] Detectar quando `qtd_executada > area_planejada`
- [ ] Exibir modal automático com:
  - [ ] Campo justificativa (min 20 chars)
  - [ ] Botão "Tirar Foto"
  - [ ] Preview da foto
- [ ] Bloquear envio se faltando justificativa OU foto
- [ ] Adicionar indicador visual "EXCEDENTE" na lista de medições
- [ ] Testar fluxo: Exceder → Modal → Foto → Justificar → Enviar

#### Frontend Web
- [ ] Criar página `RelatorioExcedentes.tsx`
- [ ] Filtro: apenas medições com `flag_excedente = true`
- [ ] Exibir: serviço, qtd planejada, qtd executada, diferença (%)
- [ ] Modal de detalhes: foto + justificativa
- [ ] Botão "Aprovar Excedente" (Gestor)

---

## 🎯 SPRINT 3: Alocação e Push (9-20 Mar)

### RF07 - Alocação Drag & Drop (16h)

#### Mobile - Setup (2h)
- [ ] Instalar: `npm install react-native-draggable-flatlist react-native-haptic-feedback react-native-reanimated`
- [ ] Configurar Reanimated: `babel.config.js`

#### Mobile - UI (10h)
- [ ] Criar `AlocacaoScreen.tsx`
- [ ] Layout: 2 colunas (Colaboradores disponíveis | Ambientes)
- [ ] Implementar drag de colaborador para ambiente
- [ ] Validação client-side ANTES de chamar API:
  - [ ] Ambiente já ocupado? → Bloquear
  - [ ] Colaborador já alocado? → Bloquear
- [ ] Feedback visual erro:
  - [ ] Vibração háptica (`Haptic.trigger('notificationError')`)
  - [ ] Shake animation no card do ambiente
  - [ ] Toast: "Ambiente em uso por [Nome]"
- [ ] Feedback visual sucesso:
  - [ ] Haptic light
  - [ ] Animação de transição suave
  - [ ] Atualização imediata da UI
- [ ] Indicador de status:
  - [ ] Badge vermelho "Em Uso" em ambientes ocupados
  - [ ] Badge verde "Disponível"
- [ ] Botão "Encerrar Tarefa" (libera ambiente)

#### Mobile - Integração (4h)
- [ ] Criar `AlocacoesService.criar()`
- [ ] Criar `AlocacoesService.encerrar()`
- [ ] Implementar persistência offline (WatermelonDB)
- [ ] Implementar sincronização automática
- [ ] Testar conflito: 2 devices tentam alocar mesmo ambiente

---

### RF09 - Push Notifications (12h)

#### Backend - Firebase Setup (3h)
- [ ] Criar projeto Firebase Console
- [ ] Baixar `firebase-adminsdk.json`
- [ ] Instalar: `npm install firebase-admin`
- [ ] Criar `push-notifications.service.ts`
- [ ] Implementar `enviarPushParaUsuario(userId, titulo, corpo)`
- [ ] Implementar `enviarPushEmLote(userIds[], titulo, corpo)`
- [ ] Adicionar variável `FIREBASE_PROJECT_ID` no `.env`

#### Backend - Integração (3h)
- [ ] Modificar `notificacoes.service.ts`:
  - [ ] Ao criar notificação → dispara push automático
- [ ] Adicionar endpoint: `PATCH /usuarios/perfil/fcm-token`
  - [ ] Salva token do dispositivo em `tb_usuarios.fcm_token`
- [ ] Criar job: "Medições Pendentes >3 dias"
  - [ ] Cron diário 08:00
  - [ ] Push para Encarregado
- [ ] Testar envio manual de push

#### Mobile - Configuração (4h)
- [ ] Instalar: `npm install @react-native-firebase/app @react-native-firebase/messaging`
- [ ] Configurar `google-services.json` (Android)
- [ ] Configurar `GoogleService-Info.plist` (iOS)
- [ ] Criar `notifications.service.ts`
- [ ] Solicitar permissão de notificações
- [ ] Obter FCM token e enviar para backend
- [ ] Implementar listener: foreground notifications
- [ ] Implementar listener: background notifications
- [ ] Deep linking: clicar na notificação → abrir tela relevante
- [ ] Testar em dispositivo físico

#### Mobile - UX (2h)
- [ ] Badge no header: contador de notificações não lidas
- [ ] Página "Notificações": lista com filtro lida/não lida
- [ ] Ação "Marcar como Lida"
- [ ] Ação "Limpar Todas"

---

## 🎯 SPRINT 4: Performance e Jobs (21 Mar - 3 Abr)

### RNF03 - Paginação (4h)

#### Backend
- [ ] Adicionar paginação em:
  - [ ] `GET /ambientes?page=1&limit=20`
  - [ ] `GET /colaboradores?page=1&limit=20`
  - [ ] `GET /medicoes?page=1&limit=20`
- [ ] Retornar metadata: `{ data: [], total, page, limit, totalPages }`
- [ ] Atualizar Swagger

#### Mobile
- [ ] Implementar FlatList com `onEndReached`
- [ ] Estado: `page`, `hasMore`, `loading`
- [ ] Loader ao carregar mais itens

---

### RNF03 - Compressão de Imagens (3h)

#### Mobile
- [ ] Instalar: `npm install react-native-image-resizer`
- [ ] Criar `ImageCompressionService`
- [ ] Implementar: redimensionar para 1024x1024px, 80% quality
- [ ] Aplicar em:
  - [ ] Fotos de evidência (medições)
  - [ ] Fotos de excedentes
  - [ ] Assinaturas (se necessário)

---

### RNF03 - Cache Redis (3h)

#### Backend
- [ ] Implementar cache em `relatorios.service.ts`:
  - [ ] `getDashboardFinanceiro()` → cache 5 min
  - [ ] `getMargemPorObra()` → cache 10 min
- [ ] Criar `CacheService` com métodos:
  - [ ] `get(key)`
  - [ ] `set(key, value, ttl)`
  - [ ] `invalidate(key)`
- [ ] Invalidar cache ao criar/atualizar dados relevantes

---

### RNF04 - Jobs Background (8h)

#### Job 1: Verificação de Prazos
- [ ] Criar `obras/jobs/verificar-prazos.processor.ts`
- [ ] Lógica: obras com `data_previsao_fim < hoje` e `status != CONCLUIDA`
- [ ] Notificar Encarregado + Gestor
- [ ] Cron: diário 06:00

#### Job 2: Consolidação Dashboard
- [ ] Criar `relatorios/jobs/consolidar-dashboard.processor.ts`
- [ ] Pré-calcular métricas:
  - [ ] Total de obras ativas
  - [ ] Total de colaboradores ativos
  - [ ] Medições dos últimos 7 dias
  - [ ] Receita vs. Custo (mês atual)
- [ ] Salvar em cache (Redis)
- [ ] Cron: a cada 1 hora

#### Dead Letter Queue
- [ ] Configurar DLQ para todas as queues
- [ ] Criar endpoint admin: `GET /admin/failed-jobs`
- [ ] Criar endpoint admin: `POST /admin/retry-job/:id`

---

### Testes E2E (12h)

#### Fluxos Críticos
- [ ] **Fluxo 1:** Financeiro cria preço → Gestor aprova → Encarregado cria medição
- [ ] **Fluxo 2:** Financeiro cria preço → Gestor rejeita → Financeiro corrige → Gestor aprova
- [ ] **Fluxo 3:** Encarregado abre RDO com GPS → Aloca colaborador → Mede produção → Encerra RDO
- [ ] **Fluxo 4:** Encarregado mede excedente → Sistema exige foto + justificativa → Gestor aprova
- [ ] **Fluxo 5:** Encarregado tenta alocar colaborador em ambiente ocupado → Sistema bloqueia
- [ ] **Fluxo 6:** Admin cria medição com preço não aprovado + justificativa → Sucesso
- [ ] **Fluxo 7:** Ciclo de faturamento: Job dispara alertas 2 dias antes

#### Performance
- [ ] Carregar dashboard com 1000+ medições: <2s
- [ ] Sincronização offline de 50 medições: <10s
- [ ] Mobile startup time: <3s

---

## 📦 DEPLOY CHECKLIST

### Banco de Dados
- [ ] Backup de produção
- [ ] Executar migrations em staging
- [ ] Validar schema em staging
- [ ] Executar migrations em produção
- [ ] Validar dados pós-migration

### Backend
- [ ] Atualizar `.env` com variáveis novas:
  - [ ] `CRYPTO_KEY` (64 hex chars)
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_PRIVATE_KEY`
  - [ ] `REDIS_HOST`
- [ ] Build: `npm run build`
- [ ] Testes: `npm run test:e2e`
- [ ] Deploy staging
- [ ] Smoke tests staging
- [ ] Deploy produção
- [ ] Health check: `GET /health`

### Mobile
- [ ] Atualizar versão em `package.json` e `app.json`
- [ ] Build Android: `cd android && ./gradlew bundleRelease`
- [ ] Build iOS: `cd ios && xcodebuild archive`
- [ ] Upload Google Play (internal testing)
- [ ] Upload TestFlight
- [ ] Testes em devices físicos (Android + iOS)
- [ ] Release para produção

### Frontend
- [ ] Build: `npm run build`
- [ ] Deploy staging (Vercel/Netlify)
- [ ] Validar rotas protegidas
- [ ] Validar performance (Lighthouse >90)
- [ ] Deploy produção

---

## 🎓 TREINAMENTO

### Semana 1
- [ ] Treinamento Gestor: Workflow de aprovação de preços (30 min)
- [ ] Treinamento Financeiro: Submissão e correção (30 min)

### Semana 2
- [ ] Treinamento Encarregado: RDO Digital (1h)
  - [ ] Como abrir RDO
  - [ ] Validação GPS
  - [ ] Captura de assinatura
- [ ] Treinamento Encarregado: Alocação de Tarefas (45 min)
  - [ ] Drag & Drop
  - [ ] Regras de bloqueio (1:1)

### Semana 3
- [ ] Treinamento Encarregado: Medições e Excedentes (45 min)
  - [ ] Foto de evidência
  - [ ] Justificativa obrigatória

---

## 📊 VALIDAÇÃO FINAL

### Aceite de Negócio
- [ ] Gestor aprova workflow de preços
- [ ] Financeiro valida alertas de faturamento
- [ ] Encarregado valida RDO mobile funciona em campo (3G)
- [ ] Encarregado valida alocação visual é intuitiva

### Aceite Técnico
- [ ] 100% dos requisitos ERS 4.0 implementados
- [ ] Code coverage >80%
- [ ] Zero bugs críticos em produção (1ª semana)
- [ ] Performance dentro dos KPIs

---

## ✅ CONCLUSÃO

**Meta:** Implementar 30% restante da ERS 4.0  
**Prazo:** 8 semanas (4 sprints)  
**Próximo Passo:** Iniciar Sprint 1 em 10/02/2026

**Status Atual:**
- Planejamento: ✅ Completo
- Sprint 1: ⏳ Aguardando início
- Sprint 2: 📅 Agendado
- Sprint 3: 📅 Agendado
- Sprint 4: 📅 Agendado

---

**Última atualização:** 10/02/2026  
**Documento vivo:** ✅ Atualizar semanalmente
