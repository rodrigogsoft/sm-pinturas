# RF06 - RDO Digital com Geolocalização

**Sprint:** 2  
**Prioridade:** P0  
**Status:** ✅ Completo  
**Data:** 10/02/2026

## 📋 Descrição

Sistema de validação de proximidade para RDO Digital, garantindo que colaboradores estejam fisicamente presentes na obra através de geolocalização GPS com tolerância de 100 metros.

## 🎯 Objetivos Alcançados

### 1. Mobile - Serviço de Geolocalização
- ✅ Gerenciamento de permissões (Android/iOS)
- ✅ Captura de coordenadas GPS de alta precisão
- ✅ Cálculo de distância (fórmula de Haversine)
- ✅ Validação de proximidade com tolerância configurável
- ✅ Tratamento robusto de erros
- ✅ Formatação e validação de coordenadas

### 2. Mobile - Integração com RDO
- ✅ Captura de localização em RDO Form
- ✅ Validação automática de proximidade
- ✅ Feedback visual (chips coloridos)
- ✅ Bloqueio de criação se fora da área
- ✅ Modo bypass para obras sem coordenadas
- ✅ Recaptura de localização

### 3. Backend - Validação de Sessões
- ✅ Validação de proximidade no momento da criação
- ✅ Cálculo de distância server-side
- ✅ Tratamento de obras sem coordenadas
- ✅ Erros descritivos com código e distância
- ✅ Tolerância de 100m configurada

### 4. Database - Schema
- ✅ Campos `geo_lat` e `geo_long` em `tb_obras`
- ✅ Migration 004 criada
- ✅ Índice otimizado para consultas espaciais
- ✅ Atualização do `init.sql`

## 📁 Arquivos Criados/Modificados

### Mobile

#### Novos Arquivos
```
mobile/src/services/
└── geolocation.service.ts              # Serviço completo de geolocalização
```

#### Arquivos Modificados
- **mobile/src/screens/RDOFormScreen.tsx**
  - Importa GeolocationService
  - Estados: proximidadeValida, distanciaObra
  - handleCapturarLocalizacao() com validação
  - capturarSemValidacao() para obras sem GPS
  - Validação obrigatória antes de salvar
  - UI com chip de status (verde/vermelho)
  - Hint sobre tolerância de 100m

### Backend

#### Arquivos Modificados
- **backend/src/modules/sessoes/sessoes.service.ts**
  - Importa Obra entity
  - Constantes: TOLERANCIA_METROS (100), RAIO_TERRA_METROS
  - Método create() com validação de proximidade
  - calcularDistancia() privado (Haversine)
  - validarProximidade() privado
  - Erros descritivos (GEOLOCALIZACAO_OBRIGATORIA, FORA_DA_AREA_OBRA)

- **backend/src/modules/sessoes/sessoes.module.ts**
  - Adiciona Obra ao TypeOrmModule.forFeature

- **backend/src/modules/obras/entities/obra.entity.ts**
  - Campos: geo_lat (float), geo_long (float)

### Database

#### Migrations
```
backend/database/migrations/
└── 004_add_obra_geolocalizacao.sql     # Adiciona geo_lat/geo_long em tb_obras
```

#### Schema
- **backend/database/init.sql**
  - Atualizado tb_obras com geo_lat e geo_long
  - Índice idx_obras_geolocalizacao

## 🔧 Detalhes Técnicos

### Geolocalização Mobile

**Fórmula de Haversine (Distância em Metros):**
```typescript
const φ1 = (lat1 * Math.PI) / 180;
const φ2 = (lat2 * Math.PI) / 180;
const Δφ = ((lat2 - lat1) * Math.PI) / 180;
const Δλ = ((lon2 - lon1) * Math.PI) / 180;

const a =
  Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

distancia = 6371000 * c; // Raio da Terra em m etros
```

**Configurações de Captura:**
```typescript
{
  enableHighAccuracy: true,  // GPS de alta precisão
  timeout: 15000,            // 15 segundos de timeout
  maximumAge: 10000,         // Cache máximo de 10s
}
```

### Fluxo de Validação

**Mobile → Backend:**
1. Usuário clica "Capturar Localização"
2. App solicita permissão (se necessário)
3. Captura coordenadas GPS
4. Calcula distância até obra
5. Valida se ≤ 100m
6. Exibe feedback visual (chip verde/vermelho)
7. Permite/bloqueia criação de RDO
8. Envia coordenadas no POST /sessoes
9. Backend valida novamente server-side
10. Retorna sucesso ou erro descritivo

### Erros e Códigos

**Mobile:**
- "Permissão de localização negada"
- "Localização indisponível. Verifique se o GPS está ativado."
- "Tempo esgotado ao tentar obter localização"
- "Você está a Xm da obra. É necessário estar a menos de 100m."

**Backend:**
```typescript
{
  message: "Esta obra requer captura de localização GPS",
  codigo: "GEOLOCALIZACAO_OBRIGATORIA"
}

{
  message: "Você está muito longe da obra (250m). É necessário estar a menos de 100m.",
  codigo: "FORA_DA_AREA_OBRA",
  distancia: 250,
  tolerancia: 100
}
```

### Permissões Android/iOS

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS (ios/[ProjectName]/Info.plist):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Precisamos da sua localização para validar que você está na obra</string>
```

## 🔍 Validaç ões Implementadas

### Mobile (Client-Side)
1. **Permissão:** Solicita antes de capturar
2. **Timeout:** 15s para obter coordenadas
3. **Precisão:** enableHighAccuracy = true
4. **Proximidade:** Calcula distância e valida ≤ 100m
5. **Feedback:** Chip visual com status e distância
6. **Bloqueio:** Não permite salvar RDO se fora da área
7. **Bypass:** Obras sem coordenadas podem criar sem validação

### Backend (Server-Side)
1. **Obra existe:** Verifica se id_obra é válido
2. **Coordenadas obra:** Se obra tem GPS, valida proximidade
3. **Coordenadas recebidas:** Se obra exige GPS, coordenadas são obrigatórias
4. **Cálculo distância:** Haversine server-side
5. **Tolerância:** 100m configurável via constante
6. **Erro descritivo:** Retorna distância e tolerância

## 📊 Casos de Uso

### Caso 1: Obra com GPS Cadastrado
- Encarregado abre app na obra
- App captura GPS automaticamente ao carregar RDO Form
- Distância: 45m
- Status: ✓ Na obra (45m) - Chip verde
- Permite criar RDO

### Caso 2: Fora da Área
- Encarregado tenta abrir RDO longe da obra
- App captura GPS: 250m de distância
- Status: ✗ Fora da área (250m) - Chip vermelho
- Alerta: "Você está muito longe. Aproxime-se para continuar"
- Botão "Salvar RDO" desabilitado

### Caso 3: Obra Sem GPS
- Obra antiga sem coordenadas cadastradas
- App exibe alerta: "Esta obra não possui coordenadas. Continuar sem validação?"
- Usuário confirma
- Captura GPS para registro, mas não valida proximidade
- Permite criar RDO normalmente

### Caso 4: GPS Desabilitado
- Usuário com GPS desabilitado no device
- App tenta capturar → Erro
- Mensagem: "Localização indisponível. Verifique se o GPS está ativado"
- Orienta habilitar GPS nas configurações

## 🧪 Testes Recomendados

### Teste Manual Mobile
1. Criar obra sem coordenadas → Bypass funciona
2. Criar obra com coordenadas válidas
3. Tentar RDO a 50m → Sucesso
4. Tentar RDO a 150m → Bloqueio
5. Recapturar após aproximar → Sucesso
6. Teste com GPS desabilitado → Erro descritivo

### Teste Backend
1. POST /sessoes com obra sem GPS → Sucesso
2. POST /sessoes com obra com GPS mas sem coordenadas enviadas → Erro GEOLOCALIZACAO_OBRIGATORIA
3. POST /sessoes com coordenadas fora da área → Erro FORA_DA_AREA_OBRA com distância
4. POST /sessoes com coordenadas dentro da área → Sucesso

### Teste E2E Sugerido
```typescript
describe('RF06 - Geolocalização RDO', () => {
  it('deve permitir RDO dentro da tolerância de 100m', async () => {
    const obra = await criarObraComGPS(-23.550520, -46.633308);
    const response = await request(app.getHttpServer())
      .post('/sessoes')
      .send({
        id_encarregado: encarregadoId,
        id_obra: obra.id,
        data_sessao: '2026-02-10',
        hora_inicio: new Date(),
        geo_lat: -23.550600, // ~90m de distância
        geo_long: -46.633400,
      });
    
    expect(response.status).toBe(201);
  });

  it('deve bloquear RDO fora da área', async () => {
    const obra = await criarObraComGPS(-23.550520, -46.633308);
    const response = await request(app.getHttpServer())
      .post('/sessoes')
      .send({
        id_encarregado: encarregadoId,
        id_obra: obra.id,
        data_sessao: '2026-02-10',
        hora_inicio: new Date(),
        geo_lat: -23.560000, // ~1km de distância
        geo_long: -46.650000,
      });
    
    expect(response.status).toBe(400);
    expect(response.body.codigo).toBe('FORA_DA_AREA_OBRA');
    expect(response.body.distancia).toBeGreaterThan(100);
  });
});
```

## 🔗 Relacionamentos com Outras Features

### Dependências
- **Entidade Obra:** Necessita campos de geolocalização
- **SessaoDiaria:** Já tinha campos geo_lat/geo_long
- **RDO Mobile:** Integração para captura e validação

### Próximos Passos (Sprint 3+)
- **Histórico de Localizações:** Track de movimentação durante o dia
- **Geofencing:** Alertas ao sair da área da obra
- **Mapa de Calor:** Visualizar áreas mais  trabalhadas
- **Relatório de Presença:** Validar horas com base em GPS

## ✅ Compliance ERS 4.0

| Requisito | Status | Observação |
|-----------|--------|------------|
| RF06.1 - Captura de GPS | ✅ | Alta precisão, timeout 15s |
| RF06.2 - Validação de proximidade | ✅ | 100m tolerância |
| RF06.3 - Bloqueio fora da área | ✅ | Client + server-side |
| RF06.4 - Feedback visual | ✅ | Chips com cor e distância |
| RF06.5 - Obras sem GPS | ✅ | Bypass implementado |

---

**Status Final:** Sprint 2 - RF06 100% Completo ✅
