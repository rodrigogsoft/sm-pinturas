# Configuração de Criptografia AES-256

## RN04: Proteção de Dados Sensíveis

O sistema implementa criptografia AES-256-GCM para proteção de dados bancários em repouso. Todos os dados na coluna `tb_colaboradores.dados_bancarios_enc` são automaticamente criptografados/descriptografados.

## Geração da Chave

Execute o seguinte comando para gerar uma chave de 32 bytes (256 bits):

```bash
# macOS/Linux
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Windows PowerShell
node -e "[System.Conversion]::ToHexString([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32))"
```

**Exemplo de saída:**
```
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

## Configuração

### 1. Arquivo `.env` (Backend)

Adicione a chave gerada ao arquivo `.env`:

```env
# Criptografia AES-256 para dados sensíveis
CRYPTO_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**IMPORTANTE:**
- A chave deve ter **exatamente 64 caracteres hexadecimais** (32 bytes)
- Nunca copie a chave para controle de versão (Git)
- Use `.env` local ou variáveis de ambiente do Docker/Kubernetes
- Nunca compartilhe a chave em público

### 2. Docker (Environment)

No `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - CRYPTO_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

### 3. Kubernetes (Secret)

```bash
kubectl create secret generic crypto-key --from-literal=CRYPTO_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1

# Reference in deployment:
env:
  - name: CRYPTO_KEY
    valueFrom:
      secretKeyRef:
        name: crypto-key
        key: CRYPTO_KEY
```

## Como Funciona

### Fluxo de Criação (POST)

```
Cliente → API
  ↓
ColaboradoresService.create()
  ├─ Valida CPF (duplicação)
  ├─ Encripta dados_bancarios → dados_bancarios_enc
  └─ Salva no banco (apenas campo criptografado)
  ↓
API → Cliente (retorna com dados descriptografados)
```

### Fluxo de Leitura (GET)

```
Cliente → API
  ↓
ColaboradoresService.findOne()
  ├─ Busca colaborador no banco
  ├─ Descriptografa dados_bancarios_enc → dados_bancarios
  └─ Retorna objeto completo
  ↓
API → Cliente (JSON com dados descriptografados)
```

### Armazenamento no Banco

A coluna `dados_bancarios_enc` armazena:

```
formato: {iv}:{authTag}:{ciphertext}

Exemplo:
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6:f1e2d3c4b5a6978089abcdef01234567:7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d...
```

Onde:
- `iv` (16 bytes): Vetor de inicialização aleatório
- `authTag` (16 bytes): Tag de autenticação GCM
- `ciphertext`: Dados criptografados

## Algoritmo Detalhes

- **Algoritmo:** AES-256-GCM (Galois/Counter Mode)
- **Força da Chave:** 256 bits (32 bytes)
- **Modo de Operação:** GCM (autenticação incluída)
- **Tamanho do IV:** 128 bits (16 bytes) - aleatório por criptografia
- **Tamanho do AuthTag:** 128 bits (16 bytes)

## Verificação de Configuração

Após iniciar a aplicação, verifique os logs:

```bash
# Tudo OK
docker logs backend | grep -i crypto

# Erro: chave não configurada
ERROR: CRYPTO_KEY não definida em variáveis de ambiente

# Erro: tamanho inválido
ERROR: CRYPTO_KEY deve ter exatamente 64 caracteres hexadecimais
```

## Rotação de Chave (Futuro)

Para implementar rotação de chave sem perder dados:

1. Manter "chave antiga" para descriptografia de dados existentes
2. Nova chave para encriptação de dados novos
3. Executar migração em background para re-encriptar dados antigos
4. After migration, retire a chave antiga

```typescript
// Pseudocódigo
const decrypt = (encrypted) => {
  try {
    return cryptoService.decrypt(encrypted, newKey);
  } catch {
    return cryptoService.decrypt(encrypted, oldKey);
  }
};
```

## Conformidade de Segurança

✅ **OWASP Top 10 - A02:2021 Cryptographic Failures**
- Dados sensíveis criptografados em repouso com AES-256
- Algoritmo forte (recomendado pelo NIST)
- Modo GCM com autenticação

✅ **LGPD (Lei Geral de Proteção de Dados)**
- Artigo 46: Medidas técnicas e administrativas
- Dados bancários são categoria especial (Art. 37)

✅ **PCI DSS 3.4**
- Render PAN (dados de pagamento) unrecognizable

## Troubleshooting

### "Erro ao descriptografar dados"

**Causa:** Chave mudou ou dados foram corrompidos
**Solução:** 
1. Verificar se `CRYPTO_KEY` está correta no `.env`
2. Se alterou a chave, os dados antigos ficarão ilegíveis
3. Backup de banco antes de alterar chave

### "CRYPTO_KEY deve ter exatamente 64 caracteres"

**Causa:** Chave inválida
**Solução:** Gerar nova chave com comando fornecido acima

### Performance degradada

**Causa:** Criptografia é CPU-intensiva
**Solução:**
1. Use servidores com CPU dedicada
2. Implemente cache para dados descriptografados
3. Use pool de workers (Bull, RabbitMQ) para operações bulk

## Referências

- [Node.js Crypto API](https://nodejs.org/api/crypto.html)
- [GCM Mode - NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
