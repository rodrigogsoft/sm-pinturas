import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../auth/entities/usuario.entity';
import { PushNotificationService } from './push-notification.service';
import { PushController } from './push.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [PushController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushModule {}
