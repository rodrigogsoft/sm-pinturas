import { ConfigService } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bullmq';

export const redisConfig = (configService: ConfigService): BullRootModuleOptions => ({
  connection: {
    host: configService.get<string>('REDIS_HOST') || 'localhost',
    port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: parseInt(configService.get<string>('REDIS_DB') || '0', 10),
  },
});
