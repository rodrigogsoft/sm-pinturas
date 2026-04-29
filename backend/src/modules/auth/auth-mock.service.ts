import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

/**
 * Mock Auth Service para desenvolvimento sem banco de dados
 * Use quando PostgreSQL não está disponível
 */
@Injectable()
export class AuthMockService {
  // Mock users for development
  private mockUsers = [
    {
      id: 1,
      nome_completo: 'Admin JB Pinturas',
      email: 'admin@jbpinturas.com.br',
      senha_hash: '$2b$12$EixZaYVK1fsbw1ZfbX3OzeIvMYvChHRkVlRQqqKvHYaS8.8.8.Yse', // 'Admin@2026'
      id_perfil: 1,
      ativo: true,
      deletado: false,
      mfa_habilitado: false,
      mfa_secret: null,
    },
  ];

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const usuario = this.mockUsers.find(
      (u) => u.email === email && u.ativo && !u.deletado,
    );

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, usuario.senha_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Generate tokens
    const accessToken = this.jwtService.sign(
      {
        sub: usuario.id,
        email: usuario.email,
      },
      {
        expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        type: 'refresh',
      },
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      mfa_required: false,
      user: {
        id: usuario.id.toString(),
        nome_completo: usuario.nome_completo,
        email: usuario.email,
        id_perfil: usuario.id_perfil,
      },
      message: 'Login realizado com sucesso (MOCK/DEV MODE)',
    };
  }
}
