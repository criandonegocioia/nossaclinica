import { Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsCronService } from './notifications.cron';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly cronService: NotificationsCronService) {}

  @Post('trigger-reminders')
  @Roles('ADMIN')
  async triggerRemindersManually() {
    const jobsCreated = await this.cronService.processReminders();
    return {
      success: true,
      message: `Trigger manual executado. ${jobsCreated} jobs enfileirados.`,
    };
  }
}

