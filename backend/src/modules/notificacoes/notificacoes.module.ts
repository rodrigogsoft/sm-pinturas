import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';
import { Notificacao } from './entities/notificacao.entity';
import { PushModule } from '../push/push.module';
import { NotificationEvent } from './entities/notification-event.entity';
import { NotificationRule } from './entities/notification-rule.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { UserNotificationPreference } from './entities/user-notification-preference.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { NotificacoesProcessor } from './notificacoes.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification-delivery',
      defaultJobOptions: {
        attempts: 1,
      },
    }),
    TypeOrmModule.forFeature([
      Notificacao,
      NotificationEvent,
      NotificationRule,
      NotificationTemplate,
      NotificationDelivery,
      UserNotificationPreference,
      Usuario,
    ]),
    PushModule,
  ],
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificacoesProcessor],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
