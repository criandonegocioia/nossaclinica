import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsCronService {
  private readonly logger = new Logger(NotificationsCronService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpcomingAppointments() {
    this.logger.debug('Iniciando varredura de agendamentos futuros para envio de lembretes...');
    await this.processReminders();
  }

  async processReminders() {
    // Definimos janela de "amanhã" (entre 24h e 25h a partir de agora)
    const now = new Date();
    const plus24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const plus25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingSchedules = await this.prisma.schedule.findMany({
      where: {
        status: 'AGENDADO',
        startAt: {
          gte: plus24Hours,
          lt: plus25Hours,
        },
      },
      include: {
        patient: true,
        professional: true,
      },
    });

    if (upcomingSchedules.length === 0) {
      this.logger.debug('Nenhum agendamento encontrado para as proximas 24 horas.');
      return 0;
    }

    this.logger.debug(`Encontrados ${upcomingSchedules.length} agendamentos. Despachando jobs...`);

    let count = 0;
    for (const schedule of upcomingSchedules) {
      if (schedule.patient) {
        await this.notificationsQueue.add('send-reminder', {
          scheduleId: schedule.id,
          patientName: schedule.patient.name,
          patientPhone: schedule.patient.phoneMain || schedule.patient.whatsapp,
          startAt: schedule.startAt,
          professionalName: schedule.professional.name,
        });
        count++;
      }
    }
    
    return count;
  }
}
