# RN04: AES-256 Criptografia para Dados Sensíveis

## ✅ Implementação Completada

A Tarefa 4 implementa criptografia AES-256-GCM para proteção de dados bancários em repouso, conforme ERS 4.0.

### Arquivos Criados/Modificados

#### 1. **Serviço de Criptografia** (novo)
- **Arquivo:** `backend/src/common/crypto/crypto.service.ts`
- **Classe:** `CryptoService`
- **Métodos:**
  - `encrypt(plaintext: string): string` - Criptografa dados
  - `decrypt(encrypted: string): string` - Descriptografa dados
  - `static generateKey(): string` - Gera chave aleatória
  - `static hash(text: string): string` - Hash SHA-256

**Detalhes Técnicos:**
- Algoritmo: AES-256-GCM (Modo Autenticado)
- IV: 16 bytes aleatórios por criptografia
- AuthTag: 16 bytes para autenticação
- Formato armazenado: `{iv}:{authTag}:{ciphertext}` (tudo em hex)

#### 2. **Entidade Colaborador** (modificada)
- **Arquivo:** `backend/src/modules/colaboradores/entities/colaborador.entity.ts`
- **Adições:**
  - Campo `dados_bancarios_enc: string | null` - Armazena dados criptografados no banco
  - Campo transiente `dados_bancarios?: {...}` - Presente em memória, nunca salvo como plaintext

#### 3. **Serviço de Colaboradores** (modificada)
- **Arquivo:** `backend/src/modules/colaboradores/colaboradores.service.ts`
- **Injeção:** `CryptoService`
- **Novo Método Privado:**
  ```typescript
  private decryptColaborador(colaborador: Colaborador | null): Colaborador | null
  ```
- **Ciclo de Vida:**
  - `create()`: Encripta `dados_bancarios` → `dados_bancarios_enc`, limpa campo plano
  - `findAll()`: Descriptografa antes de retornar
  - `findOne()`: Descriptografa antes de retornar
  - `update()`: Encripta novos `dados_bancarios`, descriptografa para retornar

#### 4. **DTOs** (modificadas)
- **Arquivo:** `backend/src/modules/colaboradores/dto/create-colaborador.dto.ts`
- **Adição:** Campo `dados_bancarios?: { banco, agencia, conta, tipo_conta }`
- **UpdateColaboradorDto:** Herda automaticamente via `PartialType()`

#### 5. **Módulos** (modificadas)
- **colaboradores.module.ts:** Adicionado `CryptoService` como provider
- **alocacoes.module.ts:** Adicionado `ItemAmbiente` ao imports
- **medicoes.module.ts:** Adicionado `TabelaPreco`, `AlocacaoTarefa`, `ItemAmbiente` ao imports

#### 6. **Controller** (modificada)
- **Arquivo:** `backend/src/modules/colaboradores/colaboradores.controller.ts`
- **POST /colaboradores:** Atualizado para mencionar que dados bancários são criptografados

#### 7. **Guia de Setup** (novo)
- **Arquivo:** `CRYPTO_SETUP.md`
- Instruções para gerar chave
- Configuração em `.env`, Docker, Kubernetes
- Troubleshooting e referências

### 🔐 Fluxo de Segurança

#### Criação de Colaborador (POST)
```
Cliente: {nome, cpf, email, dados_bancarios: {banco, agencia, ...}}
         ↓
API POST /colaboradores
   ├─ Validar CPF (duplicação)
   ├─ Encriptar dados_bancarios com CryptoService.encrypt()
   ├─ Armazenar em dados_bancarios_enc (criptografado)
   ├─ Limpar dados_bancarios antes de salvar
   └─ Descriptografar para retorno
         ↓
Cliente: {nome, cpf, email, dados_bancarios: {banco, agencia, ...}} ← descriptografado
```

#### Leitura de Colaborador (GET)
```
Cliente: GET /colaboradores/:id
         ↓
API GET /colaboradores/:id
   ├─ Buscar colaborador no banco (dados_bancarios_enc está criptografado)
   ├─ Descriptografar dados_bancarios_enc → dados_bancarios
   └─ Retornar JSON com dados descriptografados
         ↓
Cliente: {nome, cpf, email, dados_bancarios: {banco, agencia, ...}} ← descriptografado
```

#### Atualização (PATCH)
```
Cliente: PATCH /colaboradores/:id {dados_bancarios: {...}}
         ↓
API PATCH /colaboradores/:id
   ├─ Buscar colaborador existente
   ├─ Encriptar novos dados_bancarios
   ├─ Atualizar dados_bancarios_enc
   └─ Descriptografar para retorno
         ↓
Cliente: {dados_bancarios: {...}} ← descriptografado
```

### 🔑 Configuração Necessária

**Arquivo .env:**
```env
CRYPTO_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**Gerar chave:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ✅ Características Implementadas

✅ **Criptografia AES-256-GCM**
- Algoritmo forte recomendado pelo NIST
- Modo autenticado (GCM) previne tampering

✅ **IV Aleatório**
- 16 bytes aleatórios por criptografia
- Impede padrões detectáveis mesmo com mesmos dados

✅ **Erro Handling Gracioso**
- Se descreização falhar, `dados_bancarios` fica null
- Não quebra o fluxo, apenas loga erro

✅ **Separação de Responsabilidades**
- CryptoService cuida apenas de criptografia
- ColaboradoresService foca em lógica de negócio
- Reutilizável em outros módulos

✅ **OWASP Compliance**
- **A02:2021 Cryptographic Failures:** Dados sensíveis criptografados
- **A04:2021 Insecure Design:** Padrão seguro por padrão
- **A07:2021 Identification and Authentication:** Proteção de dados PII

✅ **Conformidade LGPD**
- **Art. 46:** Medidas técnicas de segurança implementadas
- **Art. 37:** Dados especiais (bancários) protegidos

### 🚀 Próximas Etapas

**Tarefa 5: MFA Google Authenticator**
- TOTP (Time-based One-Time Password) setup
- QR code generation
- 6-digit validation

**Rotação de Chave (Futuro)**
- Manter "old key" para dados existentes
- Nova key para dados novos
- Background job para re-encriptar dados antigos

**Auditoria de Acesso** (Futuro)
- Registrar quando dados sensíveis são acessados
- Logs de decrypt em auditoria

### 📋 Validação

Quando iniciar o backend:
```
✅ CRYPTO_KEY definida e válida (64 hex chars)
✅ CryptoService injetado em ColaboradoresService
✅ AlocacaoTarefa.item_ambiente adicionado
✅ CreateColaboradorDto.dados_bancarios disponível
✅ Sem erros de compilação TypeScript
```

Se houver erro ao decrypt de dados antigos:
```typescript
// Erro: Formato de dados criptografado inválido
// Solução: Dados foram criptografados com chave diferente, regenere chave
```

### 🔍 Testes Manuais

```bash
# 1. Criar colaborador com dados bancários
curl -X POST http://localhost:3000/api/colaboradores \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "João Silva",
    "cpf_nif": "123.456.789-00",
    "email": "joao@example.com",
    "dados_bancarios": {
      "banco": "Banco do Brasil",
      "agencia": "1234",
      "conta": "12345678",
      "tipo_conta": "corrente"
    }
  }'

# Resposta: dados_bancarios retorna descriptografado
# Banco: dados_bancarios_enc armazena criptografado

# 2. Buscar colaborador
curl http://localhost:3000/api/colaboradores/<id> \
  -H "Authorization: Bearer <token>"

# Resposta: dados_bancarios retorna descriptografado
```

---

**Status:** ✅ CONCLUÍDA COM SUCESSO
**Data:** 2025-02-07
**Próxima Tarefa:** Tarefa 5 - MFA Google Authenticator
