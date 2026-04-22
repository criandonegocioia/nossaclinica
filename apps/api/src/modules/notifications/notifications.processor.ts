import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { type, payload } = job.data;
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);

    try {
      if (job.name === 'send-reminder') {
        // Obter configurações de integração do banco
        const settings = await this.prisma.settings.findUnique({ where: { key: 'integrations' } });
        const integrations = settings?.value as Record<string, any> || {};
        
        const schedule = payload;
        
        this.logger.log(`Enviando lembrete para ${schedule.patientName}. WhatsApp habilitado? ${!!integrations?.whatsapp?.token}`);
        
        if (integrations?.openclaw?.agentApiUrl) {
           this.logger.log(`[OpenClaw AI] Interceptando via agente IA: ${integrations.openclaw.agentApiUrl}`);
        } else {
           this.logger.log(`[WhatsApp Oficial] Disparo direto do lembrete: "Olá ${schedule.patientName}, confirmamos sua consulta amanhã as ${new Date(schedule.startAt).toLocaleString()}"`);
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
