import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MfaService } from '../../../common/services/mfa.service';
import { AuthService } from '../auth.service';
import {
  SetupMfaResponseDto,
  ConfirmMfaSetupDto,
  VerifyMfaCodeDto,
  VerifyMfaResponseDto,
  RegenerateMfaBackupCodesDto,
  MfaBackupCodesResponseDto,
  MfaStatusDto,
} from '../dto/mfa.dto';

/**
 * Controlador para MFA (Multi-Factor Authentication)
 * RN05: Autenticação de dois fatores com Google Authenticator
 */
@ApiTags('auth/mfa')
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Inicia setup de MFA para o usuário autenticado
   */
  @Post('setup/init')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Iniciar setup de MFA',
    description:
      'Usuário autenticado inicia o processo de ativação de MFA. Retorna secret e QR code.',
  })
  @ApiResponse({
    status: 200,
    description: 'Setup iniciado com sucesso',
    type: SetupMfaResponseDto,
  })
  async setupInit(@Request() req: any): Promise<SetupMfaResponseDto> {
    const userId = req.user.sub;
    const userEmail = req.user.email;

    // Verificar se usuário já tem MFA habilitado
    const user = await this.authService.findUserById(userId);
    if (user && user.mfa_habilitado) {
      throw new BadRequestException('MFA já está ativado para este usuário');
    }

    // Gerar novo secret
    const { secret, otpauth_url } = this.mfaService.generateSecret(
      userId,
      userEmail,
    );

    // Gerar QR code
    const qr_code = await this.mfaService.generateQRCode(otpauth_url);

    // Gerar códigos de backup
    const backup_codes = this.mfaService.generateBackupCodes(8);

    return {
      secret,
      otpauth_url,
      qr_code,
      backup_codes,
      instructions:
        'Escaneie o QR code com o Google Authenticator ou Authy e insira o código 6-dígito para confirmar',
    };
  }

  /**
   * Confiroa setup de MFA
   */
  @Post('setup/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirmar setup de MFA',
    description:
      'Valida o código 6-digit do Google Authenticator e ativa MFA para a conta',
  })
  @ApiResponse({
    status: 200,
    description: 'MFA ativado com sucesso',
  })
  async setupConfirm(
    @Request() req: any,
    @Body() confirmDto: ConfirmMfaSetupDto,
  ): Promise<{ message: string; mfa_enabled: boolean }> {
    const userId = req.user.id;

    // Se for para desabilitar, validar código
    if (confirmDto.disable) {
      // Buscar usuário no banco para verificar secret atual
      const user = await this.authService.findUserById(userId);
      if (!user || !user.mfa_secret) {
        throw new BadRequestException('MFA não está ativado para este usuário');
      }

      // Validar código
      const isValid = this.mfaService.verifyToken(
        user.mfa_secret,
        confirmDto.code,
      );
      if (!isValid) {
        throw new BadRequestException('Código inválido');
      }

      // Desabilitar MFA
      await this.authService.disableMfa(userId);

      return {
        message: 'MFA desativado com sucesso',
        mfa_enabled: false,
      };
    }

    // Fluxo normal: ativar MFA
    // Em um fluxo real, o secret seria armazenado temporariamente na sessão
    // Para este exemplo, assumimos que o cliente envia o secret junto

    // TODO: Implementar armazenamento temporário de secret na sessão
    throw new BadRequestException(
      'Setup não pode ser confirmado neste endpoint. Use /auth/login/mfa-verify',
    );
  }

  /**
   * Valida código MFA durante login
   * Endpoint chamado após autenticação com email/senha se MFA estiver ativo
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código MFA no login',
    description: 'Valida código 6-digit ou código de backup durante autenticação',
  })
  @ApiResponse({
    status: 200,
    description: 'Código validado, retorna JWT token de sessão completa',
  })
  async verify(
    @Body() verifyDto: VerifyMfaCodeDto,
    @Request() req: any,
  ): Promise<VerifyMfaResponseDto> {
    // Decodificar token pré-MFA para obter ID do usuário
    // O token é o access_token retornado pelo login com mfa_required=true
    let userId: string;
    try {
      const decoded = this.authService.decodeToken(verifyDto.mfa_token);
      if (decoded.type !== 'mfa_pending') {
        throw new BadRequestException('Token inválido para validação de MFA');
      }
      userId = decoded.sub;
    } catch (error) {
      throw new BadRequestException('Token MFA expirado ou inválido');
    }

    // Buscar usuário e secret MFA
    const user = await this.authService.findUserById(userId);
    if (!user || !user.mfa_secret) {
      throw new NotFoundException('Usuário ou MFA não encontrado');
    }

    // Validar código (6 dígitos)
    const isValidCode = this.mfaService.verifyToken(user.mfa_secret, verifyDto.code);

    // Se não for código válido, tentar validar como código de backup
    let isValidBackup = false;
    if (!isValidCode && verifyDto.code && user.mfa_backup_codes) {
      // Validar backup code
      isValidBackup = user.mfa_backup_codes.includes(verifyDto.code);

      if (isValidBackup) {
        // Remover código de backup usado (one-time use)
        const remainingCodes = user.mfa_backup_codes.filter(
          (code) => code !== verifyDto.code,
        );
        await this.authService.updateMfaBackupCodes(userId, remainingCodes);
      }
    }

    if (!isValidCode && !isValidBackup) {
      throw new BadRequestException('Código MFA inválido');
    }

    // Código válido - atualizar último acesso e gerar tokens completos
    user.ultimo_acesso = new Date();
    await this.authService.saveUser(user);

    // Gerar tokens de sessão completa
    const tokens = await this.authService.generateTokens(user, req);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      message: 'MFA validado com sucesso',
      user: {
        id: user.id,
        nome_completo: user.nome_completo,
        email: user.email,
        id_perfil: user.id_perfil,
      },
    };
  }

  /**
   * Retorna status MFA do usuário autenticado
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter status MFA',
    description: 'Retorna informações sobre MFA do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Status MFA',
    type: MfaStatusDto,
  })
  async getStatus(@Request() req: any): Promise<MfaStatusDto> {
    const userId = req.user.id;

    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      mfa_enabled: user.mfa_habilitado,
      mfa_configured_at: user.mfa_configurado_em?.toISOString() || null,
      backup_codes_remaining: user.mfa_backup_codes?.length || 0,
      secret_preview: user.mfa_secret
        ? user.mfa_secret.substring(0, 8) + '...'
        : null,
    };
  }

  /**
   * Regenera códigos de backup
   */
  @Patch('backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Regenerar códigos de backup',
    description: 'Gera novos códigos de backup (requer validação com código MFA)',
  })
  @ApiResponse({
    status: 200,
    description: 'Códigos regenerados',
    type: MfaBackupCodesResponseDto,
  })
  async regenerateBackupCodes(
    @Request() req: any,
    @Body() regenerateDto: RegenerateMfaBackupCodesDto,
  ): Promise<MfaBackupCodesResponseDto> {
    const userId = req.user.id;

    const user = await this.authService.findUserById(userId);
    if (!user || !user.mfa_secret) {
      throw new BadRequestException('MFA não está ativado para este usuário');
    }

    // Validar código
    const isValid = this.mfaService.verifyToken(
      user.mfa_secret,
      regenerateDto.code,
    );
    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    // Gerar novos backup codes
    const backup_codes = this.mfaService.generateBackupCodes(8);

    // Salvar no banco
    await this.authService.updateMfaBackupCodes(userId, backup_codes);

    return {
      backup_codes,
      message: 'Novos códigos de backup gerados. Configure-os em local seguro.',
    };
  }

  /**
   * Obtém tempo restante para próximo código (útil para UI)
   */
  @Get('time-remaining')
  @ApiOperation({
    summary: 'Obter tempo restante para próximo código',
    description:
      'Retorna segundos restantes para o próximo código TOTP válido',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: { seconds_remaining: 28 },
    },
  })
  getTimeRemaining(): { seconds_remaining: number } {
    return {
      seconds_remaining: this.mfaService.getTimeRemaining(),
    };
  }
}
