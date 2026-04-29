import * as crypto from 'crypto';

/**
 * Serviço para criptografia/descriptografia de dados sensíveis
 * Usa AES-256-GCM (Galois/Counter Mode) para máxima segurança
 * 
 * RN04: Dados bancários são criptografados em repouso com AES-256
 */
export class CryptoService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly ENCODING = 'hex';
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Obtém a chave de criptografia a partir da variável de ambiente
   * IMPORTANTE: A chave deve ter 32 bytes (256 bits) para AES-256
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY não definida em variáveis de ambiente. ' +
        'Execute: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"' +
        'e coloque em .env: ENCRYPTION_KEY=<valor_gerado>'
      );
    }

    if (key.length !== 64) {
      // 64 caracteres hex = 32 bytes
      throw new Error(
        'ENCRYPTION_KEY deve ter exatamente 64 caracteres hexadecimais (32 bytes). ' +
        'Atual: ' + key.length
      );
    }

    return Buffer.from(key, 'hex');
  }

  /**
   * Criptografa um texto plano
   * Retorna: {iv}:{authTag}:{ciphertext}
   */
  encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);

      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', this.ENCODING);
      encrypted += cipher.final(this.ENCODING);

      const authTag = cipher.getAuthTag();

      // Formato: iv:authTag:ciphertext (tudo em hex)
      return `${iv.toString(this.ENCODING)}:${authTag.toString(this.ENCODING)}:${encrypted}`;
    } catch (error) {
      throw new Error(`Erro ao criptografar dados: ${error.message}`);
    }
  }

  /**
   * Descriptografa um texto criptografado
   * Espera formato: {iv}:{authTag}:{ciphertext}
   */
  decrypt(encrypted: string): string {
    try {
      const key = this.getEncryptionKey();
      const parts = encrypted.split(':');

      if (parts.length !== 3) {
        throw new Error(
          'Formato de dados criptografado inválido. Esperado: iv:authTag:ciphertext'
        );
      }

      const [ivHex, authTagHex, ciphertextHex] = parts;

      const iv = Buffer.from(ivHex, this.ENCODING);
      const authTag = Buffer.from(authTagHex, this.ENCODING);
      const ciphertext = Buffer.from(ciphertextHex, this.ENCODING);

      // Validar tamanhos
      if (iv.length !== this.IV_LENGTH) {
        throw new Error(`IV inválido: esperado ${this.IV_LENGTH} bytes, recebido ${iv.length}`);
      }

      if (authTag.length !== this.TAG_LENGTH) {
        throw new Error(
          `AuthTag inválido: esperado ${this.TAG_LENGTH} bytes, recebido ${authTag.length}`
        );
      }

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext).toString('utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Erro ao descriptografar dados: ${error.message}`);
    }
  }

  /**
   * Gera uma chave de criptografia aleatória
   * Retorna em formato hexadecimal (64 caracteres)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Gera um hash SHA-256 para comparação (para senhas, por exemplo)
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
