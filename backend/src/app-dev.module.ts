import { Module, Provider } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Disabled for development without database
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Modules
import { AuthModule } from './modules/auth/auth.module';
// Disabled modules that depend on database
// import { UsuariosModule } from './modules/usuarios/usuarios.module';
// ... other modules

// Interceptors
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

// Config
// import { typeOrmConfig } from './config/typeorm.config';
// import { redisConfig } from './config/redis.config'; // Disabled for development without Redis

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database - DISABLED for development without PostgreSQL
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: typeOrmConfig,
    //   inject: [ConfigService],
    // }),

    // Passport for JWT
    PassportModule,

    // JWT Configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ([{
        ttl: configService.get('THROTTLE_TTL') || 60,
        limit: configService.get('THROTTLE_LIMIT') || 100,
      }]),
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    // Only auth module is enabled for quick development testing
    // Other modules are disabled as they require database access
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModuleDev {}
