# Security Policy

## 🔒 Reportando uma Vulnerabilidade de Segurança

A segurança dos dados dos nossos usuários é extremamente importante para nós. Se você descobriu uma vulnerabilidade de segurança no ERP JB Pinturas, **por favor, NÃO a divulgue publicamente**.

### Como Reportar

1. **Email**: Envie um email para **security@jbpinturas.com.br** com:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir o problema
   - Possível impacto
   - Sugestões de correção (se houver)

2. **PGP**: Para informações sensíveis, use nossa chave PGP pública:
   ```
   Key ID: [A SER DEFINIDO]
   Fingerprint: [A SER DEFINIDO]
   ```

### O que Esperar

- **Confirmação**: Responderemos em até **48 horas úteis**
- **Atualização**: Manteremos você informado sobre o progresso
- **Correção**: Trabalharemos para corrigir em até **30 dias**
- **Crédito**: Você será creditado (se desejar) no CHANGELOG

### Não Reportar Via

❌ Issues públicas no GitHub  
❌ Redes sociais  
❌ Fóruns públicos  

---

## 🛡️ Versões Suportadas

| Versão | Suportada          | Manutenção até |
| ------ | ------------------ | --------------- |
| 1.x.x  | ✅ Sim             | TBD             |
| 0.x.x  | ⚠️ Apenas crítico  | 2026-06-30      |

---

## 🔐 Práticas de Segurança Implementadas

### Autenticação e Autorização

- ✅ Senhas hasheadas com **Bcrypt** (cost factor 12)
- ✅ **JWT** com expiração de 7 dias
- ✅ **MFA** obrigatório para perfis Financeiro e Gestor
- ✅ **RBAC** (Role-Based Access Control)
- ✅ Rate limiting (100 req/min por IP)
- ✅ Proteção contra brute-force

### Criptografia

- ✅ Dados sensíveis: **AES-256-GCM**
- ✅ Transmissão: **TLS 1.2+** obrigatório
- ✅ Certificados SSL renovados automaticamente
- ✅ HSTS (HTTP Strict Transport Security)

### Banco de Dados

- ✅ Prepared Statements (TypeORM)
- ✅ Input validation (class-validator)
- ✅ SQL Injection protection
- ✅ Soft delete (sem perda de auditoria)
- ✅ Backup diário criptografado

### API

- ✅ Helmet.js (headers de segurança)
- ✅ CORS configurado restritivamente
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Input sanitization
- ✅ Output escaping

### Auditoria

- ✅ Logs imutáveis (`tb_audit_logs`)
- ✅ Registro de todas as ações críticas
- ✅ IP e User-Agent capturados
- ✅ Retenção de logs: 1 ano

### Dependências

- ✅ Dependabot habilitado
- ✅ Scan automático de vulnerabilidades (Snyk)
- ✅ Atualização regular de pacotes
- ✅ Apenas dependências confiáveis

---

## 🚨 Vulnerabilidades Conhecidas

Nenhuma vulnerabilidade conhecida no momento.

**Histórico:**
- [YYYY-MM-DD] CVE-XXXX-XXXX: Descrição - Status: Corrigida em v1.0.1

---

## 📋 Checklist de Segurança para Desenvolvedores

Antes de fazer um PR, verifique:

- [ ] Não expor secrets/credenciais no código
- [ ] Validar todos os inputs do usuário
- [ ] Usar prepared statements para queries
- [ ] Sanitizar output (XSS prevention)
- [ ] Verificar permissões (RBAC)
- [ ] Adicionar logs de auditoria (ações críticas)
- [ ] Testar autenticação/autorização
- [ ] Não logar dados sensíveis
- [ ] Usar HTTPS apenas
- [ ] Documentar mudanças de segurança

---

## 🔍 Auditorias de Segurança

| Data       | Tipo         | Auditor     | Resultado |
|------------|--------------|-------------|-----------|
| 2026-Q1    | Pendente     | TBD         | -         |

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## 📞 Contato

**Equipe de Segurança:**  
Email: security@jbpinturas.com.br  
Telefone: +55 (XX) XXXX-XXXX (apenas emergências)

---

## 🏆 Hall da Fama

Agradecemos aos pesquisadores que reportaram vulnerabilidades responsavelmente:

- *Aguardando primeira contribuição*

---

**Última Atualização:** 06 de Fevereiro de 2026  
**Versão da Política:** 1.0
