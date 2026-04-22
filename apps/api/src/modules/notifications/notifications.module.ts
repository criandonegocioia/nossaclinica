import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsCronService } from './notifications.cron';
import { NotificationsProcessor } from './notifications.processor';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    PrismaModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsCronService, NotificationsProcessor],
})
export class NotificationsModule {}
