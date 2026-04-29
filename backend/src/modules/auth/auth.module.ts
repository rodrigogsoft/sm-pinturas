import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthMockService } from './auth-mock.service';
import { AuthController } from './auth.controller';
import { MfaController } from './controllers/mfa.controller';
import { Usuario } from './entities/usuario.entity';
import { AuthSession } from './entities/auth-session.entity';
import { Perfil } from '../permissoes/entities/perfil.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MfaService } from '../../common/services/mfa.service';

// Dynamic provider: Use mock service in development if database is unavailable
const authServiceProvider: Provider = {
  provide: AuthService,
  useFactory: async (
    configService: ConfigService,
  ): Promise<AuthService | AuthMockService> => {
    const nodeEnv = configService.get('NODE_ENV');
    if (nodeEnv === 'development') {
      // In development with no database, use mock service
      // This allows quick testing without PostgreSQL
      console.log('[AUTH] Using Mock AuthService (development mode)');
      return AuthMockService as any;
    }
    // In production, require real service
    return null as any; // Will be injected via normal TypeORM
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Perfil, AuthSession]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, MfaController],
  providers: [
    AuthService,
    AuthMockService,
    JwtStrategy,
    MfaService,
    // Dynamic provider that switches between real and mock auth
    {
      provide: 'AUTH_SERVICE',
      useFactory: async (
        configService: ConfigService,
        authService: AuthService,
        authMockService: AuthMockService,
      ) => {
        const nodeEnv = configService.get('NODE_ENV');
        return nodeEnv === 'development' ? authMockService : authService;
      },
      inject: [ConfigService, AuthService, AuthMockService],
    },
  ],
  exports: [AuthService, AuthMockService, JwtModule, MfaService, 'AUTH_SERVICE'],
})
export class AuthModule {}
