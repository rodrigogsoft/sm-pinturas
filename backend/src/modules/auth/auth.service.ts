import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Usuario } from './entities/usuario.entity';
import { AuthSession } from './entities/auth-session.entity';
import { Perfil } from '../permissoes/entities/perfil.entity';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(AuthSession)
    private authSessionRepository: Repository<AuthSession>,
    @InjectRepository(Perfil)
    private perfilRepository: Repository<Perfil>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Usuario> {
    const { email, password, nome_completo, id_perfil } = registerDto;

    // Verificar se email já existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const saltRounds = 12;
    const senha_hash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const usuario = this.usuarioRepository.create({
      nome_completo,
      email,
      senha_hash,
      id_perfil,
      ativo: true,
      mfa_habilitado: false,
    });

    return this.usuarioRepository.save(usuario);
  }

  async login(loginDto: LoginDto, request?: any): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuário
    const usuario = await this.usuarioRepository.findOne({
      where: { email, ativo: true, deletado: false },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, usuario.senha_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // RN05: Se MFA está habilitado, exigir validação
    if (usuario.mfa_habilitado && usuario.mfa_secret) {
      // Gerar token temporário de pré-MFA (válido por 5 minutos)
      const mfaToken = this.jwtService.sign(
        {
          sub: usuario.id,
          email: usuario.email,
          type: 'mfa_pending', // Marcador especial
        },
        {
          expiresIn: '5m',
        },
      );

      return {
        access_token: mfaToken,
        refresh_token: null, // Não retorna refresh token até MFA validado
        mfa_required: true,
        user: {
          id: usuario.id,
          nome_completo: usuario.nome_completo,
          email: usuario.email,
          id_perfil: usuario.id_perfil,
        },
        message: 'MFA necessário. Envie o código para /auth/mfa/verify',
      };
    }

    // Atualizar último acesso
    usuario.ultimo_acesso = new Date();
    await this.usuarioRepository.save(usuario);

    // Gerar tokens (MFA não habilitado)
    const { access_token, refresh_token } = await this.generateTokens(
      usuario,
      request,
    );

    // Busca permissões granulares do perfil
    const perfil = await this.perfilRepository.findOne({
      where: { id: usuario.id_perfil },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: usuario.id,
        nome_completo: usuario.nome_completo,
        email: usuario.email,
        id_perfil: usuario.id_perfil,
        permissoes_modulos: perfil?.permissoes_modulos ?? null,
      },
    };
  }

  async refreshToken(
    refresh_token: string,
    request?: any,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify(refresh_token);

      if (payload?.type !== 'refresh') {
        throw new UnauthorizedException('Tipo de token inválido');
      }

      const usuario = await this.usuarioRepository.findOne({
        where: {
          id: payload.sub,
          ativo: true,
          deletado: false,
        },
      });

      if (!usuario) {
        throw new UnauthorizedException('Sessão inválida');
      }

      let tokenValido = false;

      if (payload?.sid) {
        const sessao = await this.authSessionRepository.findOne({
          where: {
            id: payload.sid,
            id_usuario: usuario.id,
            revogado_em: IsNull(),
            deletado: false,
            expira_em: MoreThan(new Date()),
          },
        });

        if (sessao) {
          tokenValido = await bcrypt.compare(
            refresh_token,
            sessao.refresh_token_hash,
          );

          if (tokenValido) {
            sessao.revogado_em = new Date();
            await this.authSessionRepository.save(sessao);
          }
        }
      }

      if (!tokenValido && !payload?.sid && usuario.refresh_token_hash) {
        tokenValido = await bcrypt.compare(
          refresh_token,
          usuario.refresh_token_hash,
        );
      }

      if (!tokenValido) {
        throw new UnauthorizedException('Refresh token revogado');
      }

      const tokens = await this.generateTokens(usuario, request);
      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async revokeRefreshToken(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.authSessionRepository.update(
        {
          id: sessionId,
          id_usuario: userId,
          revogado_em: IsNull(),
          deletado: false,
        },
        {
          revogado_em: new Date(),
        },
      );
    }

    await this.usuarioRepository.update(
      { id: userId },
      {
        refresh_token_hash: null,
        refresh_token_expires_at: null,
      },
    );
  }

  async listActiveSessions(userId: string, currentSessionId?: string) {
    const sessoes = await this.authSessionRepository.find({
      where: {
        id_usuario: userId,
        revogado_em: IsNull(),
        deletado: false,
        expira_em: MoreThan(new Date()),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return sessoes.map((sessao) => ({
      id: sessao.id,
      created_at: sessao.created_at,
      expira_em: sessao.expira_em,
      ip_address: sessao.ip_address,
      user_agent: sessao.user_agent,
      atual: currentSessionId ? sessao.id === currentSessionId : false,
    }));
  }

  async revokeSessionById(userId: string, sessionId: string): Promise<void> {
    await this.authSessionRepository.update(
      {
        id: sessionId,
        id_usuario: userId,
        revogado_em: IsNull(),
        deletado: false,
      },
      {
        revogado_em: new Date(),
      },
    );
  }

  async revokeOtherSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<number> {
    const queryBuilder = this.authSessionRepository
      .createQueryBuilder()
      .update(AuthSession)
      .set({ revogado_em: new Date() })
      .where('id_usuario = :userId', { userId })
      .andWhere('revogado_em IS NULL')
      .andWhere('deletado = FALSE');

    if (currentSessionId) {
      queryBuilder.andWhere('id <> :currentSessionId', { currentSessionId });
    }

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }

  async validateUser(userId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId, ativo: true, deletado: false },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return usuario;
  }

  async getPerfilNomeById(idPerfil: number): Promise<string | null> {
    const perfil = await this.perfilRepository.findOne({
      where: { id: idPerfil },
      select: ['nome'],
    });

    return perfil?.nome ?? null;
  }

  /**
   * RN05: Ativa MFA para um usuário
   * @param userId - ID do usuário
   * @param secret - Secret TOTP base32
   * @param backupCodes - Códigos de backup
   */
  async enableMfa(
    userId: string,
    secret: string,
    backupCodes: string[],
  ): Promise<void> {
    await this.usuarioRepository.update(
      { id: userId },
      {
        mfa_secret: secret,
        mfa_habilitado: true,
        mfa_backup_codes: backupCodes,
        mfa_configurado_em: new Date(),
      },
    );
  }

  /**
   * RN05: Desativa MFA para um usuário
   */
  async disableMfa(userId: string): Promise<void> {
    await this.usuarioRepository.update(
      { id: userId },
      {
        mfa_secret: null,
        mfa_habilitado: false,
        mfa_backup_codes: null,
      },
    );
  }

  /**
   * RN05: Atualiza códigos de backup
   */
  async updateMfaBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    await this.usuarioRepository.update(
      { id: userId },
      {
        mfa_backup_codes: backupCodes,
      },
    );
  }

  /**
   * Buscar usuário por ID (sem excluir campos sensíveis para uso interno)
   */
  async findUserById(userId: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { id: userId, deletado: false },
    });
  }

  /**
   * Salva/atualiza um usuário no banco
   */
  async saveUser(usuario: Usuario): Promise<Usuario> {
    return this.usuarioRepository.save(usuario);
  }

  /**
   * Gera access_token e refresh_token para um usuário
   */
  async generateTokens(
    usuario: Usuario,
    request?: any,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const sessionId = randomUUID();
    const refreshTokenJti = randomUUID();
    const requestMetadata = this.extractRequestMetadata(request);

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.id_perfil,
      type: 'access',
      sid: sessionId,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });

    const refreshPayload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.id_perfil,
      type: 'refresh',
      jti: refreshTokenJti,
      sid: sessionId,
    };

    const refresh_token = this.jwtService.sign(refreshPayload, {
      expiresIn: this.refreshTokenExpiresIn,
    });

    const refreshTokenHash = await bcrypt.hash(refresh_token, 12);
    const refreshTokenPayload = this.jwtService.decode(refresh_token) as {
      exp?: number;
    };

    await this.usuarioRepository.update(
      { id: usuario.id },
      {
        refresh_token_hash: refreshTokenHash,
        refresh_token_expires_at: refreshTokenPayload?.exp
          ? new Date(refreshTokenPayload.exp * 1000)
          : null,
      },
    );

    await this.authSessionRepository.save(
      this.authSessionRepository.create({
        id: sessionId,
        id_usuario: usuario.id,
        refresh_token_hash: refreshTokenHash,
        refresh_token_jti: refreshTokenJti,
        user_agent: requestMetadata.userAgent,
        ip_address: requestMetadata.ipAddress,
        expira_em: refreshTokenPayload?.exp
          ? new Date(refreshTokenPayload.exp * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    );

    return { access_token, refresh_token };
  }

  private extractRequestMetadata(request?: any): {
    userAgent: string | null;
    ipAddress: string | null;
  } {
    if (!request) {
      return {
        userAgent: null,
        ipAddress: null,
      };
    }

    const forwardedFor = request.headers?.['x-forwarded-for'];
    const ipFromForwardedFor = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : null;

    return {
      userAgent: request.headers?.['user-agent'] || null,
      ipAddress: ipFromForwardedFor || request.ip || null,
    };
  }

  /**
   * Decodifica um JWT sem verificar a assinatura (para leitura apenas)
   * Usado para extrair payload de tokens temporários como pré-MFA
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
