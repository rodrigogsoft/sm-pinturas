# RF07 - Alocação Visual com Drag & Drop

**Status**: ✅ Implementado  
**Data**: 10 de fevereiro de 2026  
**Sprint**: 3  

---

## 📋 Resumo

Implementação da funcionalidade de alocação visual de colaboradores em ambientes usando drag-and-drop, permitindo ao encarregado gerenciar a equipe de forma intuitiva através de gestos de arrastar e soltar no aplicativo móvel.

---

## 🎯 Objetivos

- [x] Implementar tela de alocação com drag-and-drop
- [x] Integrar com API de sessões e alocações
- [x] Implementar validação de conflitos (colaborador/ambiente ocupado)
- [x] Adicionar feedback tátil (haptic) para ações
- [x] Exibir estatísticas em tempo real
- [x] Permitir conclusão de alocações
- [x] Integrar navegação desde a tela de Obras

---

## 🏗️ Arquitetura

### Mobile (React Native)

#### 1. **AlocacaoScreen** (`mobile/src/screens/Alocacao/AlocacaoScreen.tsx` - 725 linhas)

**Responsabilidades:**
- Gerenciar interface de drag-and-drop usando `react-native-drax`
- Coordenar estados de colaboradores e ambientes
- Validar conflitos antes de criar alocação
- Fornecer feedback tátil via `react-native-haptic-feedback`
- Exibir estatísticas dinâmicas

**Estrutura:**
```tsx
<DraxProvider>
  <ScrollView refreshControl={<RefreshControl />}>
    {/* Card de Estatísticas */}
    <Card>
      <Colaboradores Ativos | Ambientes em Uso | Concluídas>
    </Card>

    {/* Seção de Colaboradores Draggable */}
    <View>
      {colaboradores.map(colab => (
        <DraxView 
          draggable={colab.status === 'livre'}
          payload={colab}
        >
          {/* Card do colaborador com status visual */}
        </DraxView>
      ))}
    </View>

    {/* Seção de Ambientes (Drop Zones) */}
    <View>
      {ambientes.map(amb => (
        <DraxView 
          receptive={true}
          onReceiveDragDrop={(event) => handleDrop(event.dragged.payload, amb)}
        >
          {/* Card do ambiente */}
        </DraxView>
      ))}
    </View>

    {/* Seção de Tarefas em Andamento */}
    {alocacoes.length > 0 && (
      <View>
        {alocacoes.map(aloc => (
          <Card>
            {/* Detalhes da alocação */}
            <Button onPress={() => handleConcluirAlocacao(aloc)}>
              Concluir
            </Button>
          </Card>
        ))}
      </View>
    )}
  </ScrollView>
</DraxProvider>
```

**Estados:**
```typescript
interface ColaboradorComStatus {
  ...Colaborador;
  status: 'livre' | 'ocupado' | 'alocando';
}

interface AmbienteComOcupacao {
  ...Ambiente;
  ocupado: boolean;
}

// Estados principais
const [colaboradores, setColaboradores] = useState<ColaboradorComStatus[]>([]);
const [ambientes, setAmbientes] = useState<AmbienteComOcupacao[]>([]);
const [alocacoes, setAlocacoes] = useState<AlocacaoTarefa[]>([]);
const [estatisticas, setEstatisticas] = useState<Estatisticas>(...);
const [carregando, setCarregando] = useState(false);
```

**Fluxo de Drag & Drop:**
```typescript
// 1. Usuário inicia drag
<DraxView 
  draggable={colaborador.status === 'livre'}
  dragPayload={colaborador}
  onDragStart={() => Haptic.impactLight()}
/>

// 2. Usuário solta sobre um ambiente
<DraxView 
  receptive={true}
  onReceiveDragDrop={({ dragged }) => handleDrop(dragged.payload, ambiente)}
/>

// 3. Validação e criação
async function handleDrop(colaborador, ambiente) {
  // Validação client-side
  if (colaborador.status !== 'livre') {
    Haptic.notificationError();
    Alert.alert('Erro', 'Colaborador já está alocado');
    return;
  }
  
  if (ambiente.ocupado) {
    Haptic.notificationError();
    Alert.alert('Erro', 'Ambiente já está ocupado');
    return;
  }

  // UI otimista
  setColaboradorStatus(colaborador.id, 'alocando');
  
  try {
    // Chamada à API
    const novaAlocacao = await criarAlocacao({
      id_sessao,
      id_colaborador: colaborador.id,
      id_ambiente: ambiente.id
    });
    
    // Sucesso
    Haptic.impactLight();
    atualizarEstados(novaAlocacao);
    Alert.alert('Sucesso', 'Alocação criada!');
    
  } catch (error) {
    // Rollback UI
    setColaboradorStatus(colaborador.id, 'livre');
    
    if (error.codigo === 409) {
      // Conflito detectado pelo backend
      Haptic.notificationError();
      Alert.alert('Conflito', error.message);
    }
  }
}
```

**Haptic Feedback:**
- `impactLight()`: Drag iniciado, drop bem-sucedido
- `notificationError()`: Validação falhou, conflito detectado
- `notificationSuccess()`: Alocação concluída

**Cores de Status:**
- 🟢 Verde (`#4CAF50`): Colaborador livre
- 🟠 Laranja (`#FF9800`): Colaborador ocupado
- 🔵 Azul (`#2196F3`): Colaborador alocando (loading)

#### 2. **AlocacoesService** (`mobile/src/services/alocacoes.service.ts`)

**Endpoints:**
```typescript
// Criar alocação (drag & drop)
POST /alocacoes
Body: { id_sessao, id_colaborador, id_ambiente, observacoes? }
Response: AlocacaoTarefa
Error: ConflictError (409) se colaborador/ambiente ocupado

// Listar alocações ativas
GET /alocacoes?id_sessao=X&status=EM_ANDAMENTO
Response: AlocacaoTarefa[]

// Obter estatísticas
GET /alocacoes/estatisticas/:id_sessao
Response: {
  total_alocacoes: number;
  em_andamento: number;
  concluidas: number;
  colaboradores_ativos: number;
  ambientes_ativos: number;
}

// Concluir alocação
PATCH /alocacoes/:id/concluir
Body: { observacoes?: string }
Response: AlocacaoTarefa (status = 'CONCLUIDA')

// Verificar se ambiente está ocupado
GET /alocacoes/ambiente/:id_ambiente/ocupado
Response: { ocupado: boolean, alocacao?: AlocacaoTarefa }
```

**Tratamento de Erros:**
```typescript
interface ConflictError {
  statusCode: 409;
  message: string;
  codigo: 'COLABORADOR_JA_ALOCADO' | 'AMBIENTE_JA_OCUPADO';
  colaborador_atual?: string; // Se colaborador ocupado
  ambiente_atual?: string;     // Se ambiente ocupado
}

// Uso
try {
  await AlocacoesService.criar(dados);
} catch (error) {
  if (error.statusCode === 409) {
    // Conflito - outro usuário alocou antes
    Alert.alert('Conflito', `${error.message}\n\nColaborador atual: ${error.colaborador_atual}`);
  }
}
```

#### 3. **SessoesService** (`mobile/src/services/sessoes.service.ts`)

**Endpoints:**
```typescript
// Buscar sessão aberta do encarregado
GET /sessoes/aberta/:id_encarregado
Response: SessaoDiaria | null (404 se não houver)

// Criar nova sessão
POST /sessoes
Body: {
  id_obra: string;
  id_encarregado: string;
  geo_lat: number;
  geo_long: number;
}
Response: SessaoDiaria
```

**Fluxo de Navegação:**
```typescript
// ObrasScreen -> AlocacaoScreen
async function abrirAlocacao(obra: Obra) {
  // 1. Verificar se há sessão aberta
  const sessaoExistente = await SessoesService.buscarSessaoAberta(encarregado.id);
  
  if (sessaoExistente) {
    if (sessaoExistente.id_obra === obra.id) {
      // Sessão existente para esta obra - navegar diretamente
      navigation.navigate('Alocacao', { sessao: sessaoExistente, obra });
    } else {
      // Sessão aberta para outra obra - bloquear
      Alert.alert('Erro', `Você tem uma sessão aberta em outra obra: ${sessaoExistente.obra.nome}`);
    }
    return;
  }
  
  // 2. Validar geolocalização (se obra tiver GPS)
  if (obra.geo_lat && obra.geo_long) {
    const localizacaoAtual = await GeolocationService.getCurrentPosition();
    const distancia = calcularDistancia(localizacaoAtual, obra);
    
    if (distancia > RAIO_MAX_METROS) {
      Alert.alert('Erro', `Você está ${distancia}m da obra. Aproxime-se para iniciar a sessão.`);
      return;
    }
  }
  
  // 3. Criar sessão
  const novaSessao = await SessoesService.criarSessao({
    id_obra: obra.id,
    id_encarregado: encarregado.id,
    geo_lat: localizacaoAtual.latitude,
    geo_long: localizacaoAtual.longitude
  });
  
  // 4. Navegar para Alocacao
  navigation.navigate('Alocacao', { sessao: novaSessao, obra });
}
```

#### 4. **Navegação - ObrasScreen** (Modificado)

**Botão adicional:**
```tsx
<View style={styles.actionsRow}>
  {/* Botão existente */}
  <Button 
    mode="contained"
    icon="file-document"
    onPress={() => navigation.navigate('NovoRDO', { obra })}
  >
    Novo RDO
  </Button>
  
  {/* Novo botão para RF07 */}
  <Button 
    mode="outlined"
    icon="account-group"
    loading={alocacaoLoadingId === obra.id}
    disabled={alocacaoLoadingId !== null}
    onPress={() => abrirAlocacao(obra)}
    style={styles.buttonAlocar}
  >
    Alocar
  </Button>
</View>
```

---

## 📊 Modelos de Dados

### Interface `AlocacaoTarefa`

```typescript
interface AlocacaoTarefa {
  id: string;
  id_sessao: string;
  id_colaborador: string;
  id_ambiente: string;
  status: 'EM_ANDAMENTO' | 'PAUSADA' | 'CONCLUIDA';
  hora_inicio: string; // ISO 8601
  hora_fim?: string;   // ISO 8601
  duracao_minutos?: number;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  
  // Joins (quando populated)
  colaborador?: Colaborador;
  ambiente?: Ambiente;
  sessao?: SessaoDiaria;
}
```

### Interface `ConflictError`

```typescript
interface ConflictError extends Error {
  statusCode: 409;
  message: string;
  codigo: 'COLABORADOR_JA_ALOCADO' | 'AMBIENTE_JA_OCUPADO';
  colaborador_atual?: string; // Nome do colaborador ocupado
  ambiente_atual?: string;     // Nome do ambiente ocupado
}
```

---

## ✅ Testes Realizados

### Compilação TypeScript
- ✅ Sem erros de tipo
- ✅ Todos os imports resolvidos
- ✅ Interfaces consistentes

### Validação de Código
- ✅ Componentes React Native válidos
- ✅ Hooks usados corretamente
- ✅ Serviços com tratamento de erro adequado

### Testes Manuais (Planejados)

1. **Drag & Drop Básico**
   - [ ] Arrastar colaborador livre para ambiente disponível
   - [ ] Verificar haptic feedback ao iniciar drag
   - [ ] Verificar criação da alocação na API
   - [ ] Verificar atualização do estado (colaborador → ocupado, ambiente → ocupado)

2. **Validação de Conflitos**
   - [ ] Tentar arrastar colaborador ocupado (drag desabilitado)
   - [ ] Tentar soltar em ambiente ocupado (erro + haptic)
   - [ ] Verificar mensagem de erro com detalhes do conflito

3. **Conclusão de Alocação**
   - [ ] Clicar em "Concluir" em alocação ativa
   - [ ] Verificar confirmação via Alert
   - [ ] Verificar atualização de estado (colaborador → livre, ambiente → disponível)
   - [ ] Verificar estatísticas atualizadas

4. **Navegação**
   - [ ] Abrir "Alocar" em obra sem sessão (cria sessão)
   - [ ] Abrir "Alocar" em obra com sessão existente (navega direto)
   - [ ] Tentar abrir "Alocar" em outra obra (bloqueado)
   - [ ] Validação de geolocalização (se obra tiver GPS)

5. **Refresh & Estados**
   - [ ] Pull-to-refresh atualiza dados
   - [ ] Loading states exibidos corretamente
   - [ ] Estatísticas corretas (colaboradores ativos, ambientes em uso, concluídas)

---

## 📦 Dependências Adicionadas

```json
{
  "react-native-drax": "^0.10.3",          // Drag & drop
  "react-native-haptic-feedback": "^2.2.0" // Feedback tátil
}
```

### Configurações Necessárias

**iOS** (`ios/Podfile`):
```ruby
pod 'react-native-haptic-feedback', :path => '../node_modules/react-native-haptic-feedback'
```

**Android** (`android/app/build.gradle`):
```gradle
implementation project(':react-native-haptic-feedback')
```

---

## 🚀 Como Testar

### 1. Instalar Dependências

```bash
cd mobile
npm install
```

### 2. Instalar Pods (iOS)

```bash
cd ios
pod install
cd ..
```

### 3. Executar Aplicativo

```bash
# Android
npm run android

# iOS
npm run ios
```

###  4. Fluxo de Teste

1. Login com usuário **ENCARREGADO**
2. Navegar para tela **Obras**
3. Clicar em **"Alocar"** em uma obra
4. (Primeira vez) Sessão será criada automaticamente
5. Tela de Alocação será exibida com:
   - Colaboradores disponíveis (arrastar)
   - Ambientes da obra (soltar)
   - Estatísticas no topo
6. **Arrastar** colaborador verde para um ambiente
7. Verificar feedback tátil e mensagem de sucesso
8. Colaborador fica laranja, ambiente fica ocupado
9. Aparece na seção "Tarefas em Andamento"
10. Clicar em **"Concluir"** para finalizar alocação

---

## 🐛 Troubleshooting

### Drag não funciona

- Verificar se `DraxProvider` envolve a tela
- Verificar se `draggable={true}` no DraxView do colaborador
- Verificar se colaborador tem `status === 'livre'`

### Haptic não funciona (iOS)

- Permissão necessária em `Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
</array>
```

### Conflito não detectado

- Verificar se backend retorna status 409
- Verificar se `ConflictError` tem campos `codigo`, `colaborador_atual`, `ambiente_atual`
- Verificar logs do console: `console.error('Erro ao criar alocação:', error)`

### Estatísticas não atualizam

- Verificar se `carregarDados()` é chamado após criar/concluir alocação
- Verificar se endpoint `/alocacoes/estatisticas/:id_sessao` retorna dados corretos

---

## 📋 Próximas Melhorias

- [ ] Animações de transição de estado (livre → alocando → ocupado)
- [ ] Arrastar múltiplos colaboradores para múltiplos ambientes (batch)
- [ ] Filtros: colaboradores por nome, ambientes por pavimento
- [ ] Histórico de alocações (timeline)
- [ ] Notificação push quando colaborador conclui tarefa
- [ ] Drag & drop entre ambientes (realocar colaborador)
- [ ] Modo offline: sincronizar alocações quando voltar online

---

## 📚 Referências

- [React Native Drax](https://github.com/nuclearpasta/react-native-drax) - Documentação oficial
- [React Native Haptic Feedback](https://github.com/mkuczera/react-native-haptic-feedback) - Documentação oficial
- [ERS 4.0 - RF07](../../docs/ERS-v4.0.md#rf07-alocação-visual-de-equipe) - Especificação original

---

**Última atualização**: 10 de fevereiro de 2026  
**Autor**: Sistema JB Pinturas - Equipe de Desenvolvimento
