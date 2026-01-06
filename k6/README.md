# k6 Performance Tests

Testes de carga e performance para a API JB Pinturas usando **k6**.

## Instalação

```bash
# macOS/Linux
brew install k6

# Windows (chocolatey)
choco install k6

# ou download direto: https://k6.io/docs/getting-started/installation/
```

## Como Rodar

### Load Test (gradual ramp-up 0→50 usuários)
```bash
BASE_URL=http://localhost:3001 k6 run load-test.js
```

### Spike Test (spike 10→100 usuários)
```bash
BASE_URL=http://localhost:3001 k6 run spike-test.js
```

### Com HTML Report
```bash
k6 run --out=html=report.html load-test.js
# Abre report.html no navegador
```

## Configuração dos Testes

### Load Test (`load-test.js`)
- **Duração**: ~14 minutos
- **Estágios**:
  - 0-2m: Ramp-up 0→10 usuários
  - 2-7m: Ramp-up 10→50 usuários
  - 7-12m: Steady 50 usuários
  - 12-14m: Ramp-down 50→0 usuários
- **Métricas**: Login time, create client, list users/clients, error rate
- **Thresholds**:
  - p(95) < 500ms
  - p(99) < 1000ms
  - Error rate < 10%

### Spike Test (`spike-test.js`)
- **Duração**: ~4 minutos
- **Estágios**:
  - 0-1m: Baseline 10 usuários
  - 1-1:30m: Spike 10→100 usuários
  - 1:30-2:30m: Hold 100 usuários
  - 2:30-3m: Drop 100→10 usuários
  - 3-4m: Ramp-down 10→0 usuários
- **Endpoints**: GET users, clients, works, collaborators
- **Thresholds** (relaxados para spike):
  - p(95) < 1000ms
  - p(99) < 2000ms
  - Error rate < 15%

## Interpretando Resultados

### Métricas Principais
- **http_req_duration**: Tempo de resposta (ms)
- **http_req_failed**: Taxa de requisições falhadas
- **errors**: Taxa de erros customizados
- **login_duration**: Tempo apenas para login
- **response_times**: Tempo de resposta geral

### Exemplo de Output
```
scenarios: (100.00%) 1 scenario, 50 max VUs, 14m30s max duration
  default: 14m30s test w/ 50 max VUs
    
✓ login succeeded
✓ list users succeeded
✓ list clients succeeded
  
checks......................: 100.00% 4500 out of 4500
data_received..............: 5.2 MB  5.8 kB/s
data_sent..................: 1.8 MB  2.1 kB/s
http_req_blocked...........: avg=12ms   min=0ms    med=1ms    max=156ms  p(90)=32ms   p(95)=51ms   p(99)=112ms
http_req_connecting........: avg=3ms    min=0ms    med=0ms    max=89ms   p(90)=8ms    p(95)=12ms   p(99)=32ms
http_req_duration..........: avg=156ms  min=21ms   med=98ms   max=856ms  p(90)=412ms  p(95)=498ms  p(99)=789ms
http_req_failed............: 0.00%   0 out of 4500
http_req_receiving.........: avg=15ms   min=1ms    med=7ms    max=156ms  p(90)=41ms   p(95)=69ms   p(99)=102ms
http_req_sending...........: avg=4ms    min=0ms    med=2ms    max=45ms   p(90)=11ms   p(95)=18ms   p(99)=32ms
http_req_tls_connecting...: avg=0ms    min=0ms    med=0ms    max=0ms    p(90)=0ms    p(95)=0ms    p(99)=0ms
http_req_waiting...........: avg=137ms  min=11ms   med=87ms   max=756ms  p(90)=398ms  p(95)=478ms  p(99)=712ms
http_reqs..................: 4500    5.2/s
iteration_duration.........: avg=8.1s   min=2.1s   med=8.5s   max=14.2s  p(90)=9.8s   p(95)=10.2s  p(99)=11.1s
iterations.................: 750     0.86/s
vus........................: 1       min=0     max=50
vus_max.....................: 50      min=50    max=50
```

### Interpretação
- ✓ **Checks passed**: Endpoints respondendo conforme esperado
- **http_req_duration p(95)<500ms**: 95% das requisições < 500ms (bom!)
- **http_req_failed 0%**: Nenhuma falha (excelente)
- **iterations 0.86/s**: ~0.86 iterações por segundo (throughput)

## Otimizações Recomendadas

Se performance estiver abaixo do esperado:
1. **Database**: Adicione índices em campos frequentemente consultados
2. **Caching**: Implementar Redis para queries frequentes
3. **Connection Pooling**: Aumentar pool de conexões PostgreSQL
4. **Load Balancing**: Adicionar nginx/HAProxy em produção
5. **Horizontal Scaling**: Aumentar réplicas do backend

## Próximos Passos

- Executar testes regulares após cada deploy
- Monitorar métricas em produção com Prometheus/Grafana
- Otimizar endpoints que excedem thresholds
- Testes de stress (carga além de limites esperados)
