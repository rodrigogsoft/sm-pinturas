import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ObrasModule } from './modules/obras/obras.module';
import { ColaboradoresModule } from './modules/colaboradores/colaboradores.module';
import { ServicosCatalogoModule } from './modules/servicos-catalogo/servicos-catalogo.module';
import { Usuario } from './modules/usuarios/entities/usuario.entity';
import { Cliente } from './modules/clientes/entities/cliente.entity';
import { Obra } from './modules/obras/entities/obra.entity';
import { Colaborador } from './modules/colaboradores/entities/colaborador.entity';
import { ServicoCatalogo } from './modules/servicos-catalogo/entities/servico-catalogo.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'sm_pinturas'),
        entities: [Usuario, Cliente, Obra, Colaborador, ServicoCatalogo],
        synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE', false),
        logging: false,
      }),
    }),
    AuthModule,
    UsuariosModule,
    ClientesModule,
    ObrasModule,
    ColaboradoresModule,
    ServicosCatalogoModule,
  ],
})
export class AppModule {}
