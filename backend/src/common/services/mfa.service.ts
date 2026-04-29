import { Injectable, BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

/**
 * Serviço para MFA (Multi-Factor Authentication) com Google Authenticator
 * RN05: Autenticação de dois fatores com TOTP (Time-based One-Time Password)
 * 
 * Fluxo:
 * 1. Usuário solicita setup MFA → gera secret + QR code
 * 2. Usuário escaneia QR code no Google Authenticator
 * 3. Usuário entra um código 6-digit para confirmar
 * 4. Na próxima autenticação, exige código 6-digit adicional
 */
@Injectable()
export class MfaService {
  /**
   * Gera um novo secret TOTP e retorna URL para QR code
   * 
   * @param userId - ID do usuário
   * @param userEmail - Email do usuário (para o label no Google Authenticator)
   * @param appName - Nome da aplicação (padrão: "SM Pinturas")
   * @returns Secret e URL otpauth para QR code
   */
  generateSecret(
    userId: string,
    userEmail: string,
    appName: string = 'SM Pinturas',
  ): {
    secret: string;
    otpauth_url: string;
  } {
    // Gerar secret aleatório (base32)
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
      symbols: true,
    });

    // Garantir que otpauth_url está definido
    const otpauth_url = secret.otpauth_url || '';
    if (!otpauth_url) {
      throw new BadRequestException('Falha ao gerar otpauth URL');
    }

    return {
      secret: secret.base32 || '',
      otpauth_url,
    };
  }

  /**
   * Gera QR code em formato DataURL
   * 
   * @param otpauth_url - URL otpauth gerada por generateSecret()
   * @returns DataURL base64 do QR code
   */
  async generateQRCode(otpauth_url: string): Promise<string> {
    try {
      return await qrcode.toDataURL(otpauth_url, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      throw new BadRequestException(
        `Erro ao gerar QR code: ${error.message}`,
      );
    }
  }

  /**
   * Valida um código TOTP inserido pelo usuário
   * 
   * @param secret - Secret armazenado do usuário
   * @param token - Código 6-digit inserido pelo usuário
   * @param window - Janela de tolerância (padrão: 1, aceita ±30 segundos)
   * @returns true se válido, false caso contrário
   */
  verifyToken(secret: string, token: string, window: number = 1): boolean {
    try {
      // Validar formato: 6 dígitos
      if (!/^\d{6}$/.test(token)) {
        return false;
      }

      // Validar usando speakeasy com janela de tolerância
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window,
      });

      return Boolean(verified);
    } catch (error) {
      console.error('Erro ao validar token TOTP:', error);
      return false;
    }
  }

  /**
   * Gera códigos de backup (recuperação) para MFA
   * Se o usuário perder acesso ao seu autenticador, pode usar esses códigos
   * 
   * @param count - Quantidade de códigos a gerar (padrão: 8)
   * @returns Array com códigos de backup (formato: XXXX-XXXX)
   */
  generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Gerar código: 4 dígitos + hífen + 4 dígitos
      const part1 = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const part2 = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      codes.push(`${part1}-${part2}`);
    }

    return codes;
  }

  /**
   * Valida um código de backup
   * 
   * @param codes - Array de códigos de backup armazenados
   * @param token - Código inserido pelo usuário
   * @returns Objeto com validação e códigos restantes
   */
  verifyBackupCode(codes: string[], token: string): {
    isValid: boolean;
    remainingCodes?: string[];
  } {
    if (!codes || codes.length === 0) {
      return { isValid: false };
    }

    // Normalizar para comparação (remover hífens)
    const normalizedToken = token.replace(/-/g, '');
    const index = codes.findIndex(
      (code) => code.replace(/-/g, '') === normalizedToken,
    );

    if (index === -1) {
      return { isValid: false };
    }

    // Remove o código usado (one-time use)
    const remainingCodes = codes.filter((_, i) => i !== index);

    return {
      isValid: true,
      remainingCodes,
    };
  }

  /**
   * Formata códigos de backup para exibição
   * 
   * @param codes - Array de códigos
   * @returns String formatada com espaçamento
   */
  formatBackupCodes(codes: string[]): string {
    return codes.join(' ');
  }

  /**
   * Valida a tolerância de tempo (clock skew)
   * Útil para sincronizar servidor e cliente
   * 
   * @param secret - Secret do usuário
   * @param token - Token inserido
   * @param options - Opções de validação
   * @returns Objeto com informações de validação
   */
  validateWithDetails(
    secret: string,
    token: string,
    options: { window?: number; time?: number } = {},
  ): {
    isValid: boolean;
    message: string;
    remainingTime?: number;
  } {
    // Validar formato
    if (!/^\d{6}$/.test(token)) {
      return {
        isValid: false,
        message: 'Código deve ter 6 dígitos',
      };
    }

    // Verificar token usando o método verifyToken
    const isValid = this.verifyToken(secret, token, options.window || 1);

    if (isValid) {
      return {
        isValid: true,
        message: 'Código válido',
        remainingTime: 30 - ((Math.floor(Date.now() / 1000) % 30)),
      };
    }

    return {
      isValid: false,
      message: 'Código inválido ou expirado',
      remainingTime: 30 - ((Math.floor(Date.now() / 1000) % 30)),
    };
  }

  /**
   * Obtém o tempo restante para o próximo código
   * Útil para feedback visual na UI
   * 
   * @returns Segundos restantes (0-30)
   */
  getTimeRemaining(): number {
    return 30 - ((Math.floor(Date.now() / 1000) % 30));
  }
}
