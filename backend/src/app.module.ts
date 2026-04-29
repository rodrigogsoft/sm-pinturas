import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Modules
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ObrasModule } from './modules/obras/obras.module';
import { PavimentosModule } from './modules/pavimentos/pavimentos.module';
import { AmbientesModule } from './modules/ambientes/ambientes.module';
import { ItensAmbienteModule } from './modules/itens-ambiente/itens-ambiente.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ColaboradoresModule } from './modules/colaboradores/colaboradores.module';
import { ServicosModule } from './modules/servicos/servicos.module';
import { PrecosModule } from './modules/precos/precos.module';
import { SessoesModule } from './modules/sessoes/sessoes.module';
import { AlocacoesModule } from './modules/alocacoes/alocacoes.module';
import { AlocacoesItensModule } from './modules/alocacoes-itens/alocacoes-itens.module';
import { MedicoesModule } from './modules/medicoes/medicoes.module';
import { MedicoesColaboradorModule } from './modules/medicoes-colaborador/medicoes-colaborador.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { ValeAdiantamentoModule } from './modules/vale-adiantamento/vale-adiantamento.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { PushModule } from './modules/push/push.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { RdoModule } from './modules/rdo/rdo.module';
import { OsFinalizacaoModule } from './modules/os-finalizacao/os-finalizacao.module';
import { ApropriacoesFinanceirasModule } from './modules/apropriacoes-financeiras/apropriacoes-financeiras.module';
import { PermissoesModule } from './modules/permissoes/permissoes.module';
import { ConfiguracoesModule } from './modules/configuracoes/configuracoes.module';

// Interceptors
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

// Config
import { typeOrmConfig } from './config/typeorm.config';
import { redisConfig } from './config/redis.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database - PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),

    // Redis & BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: redisConfig,
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
    HealthModule,
    AuthModule,
    UsuariosModule,
    ObrasModule,
    PavimentosModule,
    AmbientesModule,
    ItensAmbienteModule,
    ClientesModule,
    ColaboradoresModule,
    ServicosModule,
    PrecosModule,
    SessoesModule,
    AlocacoesModule,
    AlocacoesItensModule,
    MedicoesModule,
    MedicoesColaboradorModule,
    FinanceiroModule,
    ValeAdiantamentoModule,
    NotificacoesModule,
    PushModule,
    AuditoriaModule,
    UploadsModule,
    RelatoriosModule,
    JobsModule,
    RdoModule,
    OsFinalizacaoModule,
    ApropriacoesFinanceirasModule,
    PermissoesModule,
    ConfiguracoesModule,
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
export class AppModule {}
