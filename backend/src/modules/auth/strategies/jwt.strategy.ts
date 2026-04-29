import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const usuario = await this.authService.validateUser(payload.sub);
    const perfilNome = await this.authService.getPerfilNomeById(
      Number(usuario.id_perfil),
    );

    if (!usuario) {
      throw new UnauthorizedException();
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nome_completo: usuario.nome_completo,
      perfil: usuario.id_perfil,
      perfil_nome: perfilNome,
      sid: payload.sid || null,
    };
  }
}
