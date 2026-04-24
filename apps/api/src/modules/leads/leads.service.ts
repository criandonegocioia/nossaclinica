import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normaliza telefone removendo tudo que não é dígito.
   * Ex: "+55 (11) 99999-9999" → "5511999999999"
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  async findAll(params: {
    stage?: string;
    source?: string;
    assignedTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { stage, source, assignedTo, search, page = 1, limit = 100 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};
    if (stage) where.status = stage as never;
    if (source) where.source = source as never;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { interest: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  async create(data: Prisma.LeadCreateInput) {
    const phone = (data as any).phone as string | undefined;

    if (phone) {
      const normalized = this.normalizePhone(phone);

      // 1. Já é paciente? Retorna o paciente existente
      const existingPatient = await this.prisma.patient.findFirst({
        where: {
          OR: [
            { phoneMain: { contains: normalized } },
            { whatsapp: { contains: normalized } },
          ],
        },
      });

      if (existingPatient) {
        throw new ConflictException({
          message: `Este telefone já pertence ao paciente "${existingPatient.name}"`,
          existingType: 'PATIENT',
          existingId: existingPatient.id,
          existingName: existingPatient.name,
        });
      }

      // 2. Já é lead? Retorna o lead existente
      const existingLead = await this.prisma.lead.findFirst({
        where: { phone: { contains: normalized } },
      });

      if (existingLead) {
        throw new ConflictException({
          message: `Este telefone já pertence ao lead "${existingLead.name}" (${existingLead.status})`,
          existingType: 'LEAD',
          existingId: existingLead.id,
          existingName: existingLead.name,
          existingStage: existingLead.status,
        });
      }
    }

    return this.prisma.lead.create({ data });
  }

  async update(id: string, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({ where: { id }, data });
  }

  async updateStage(id: string, stage: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { status: stage as never },
    });
  }

  async addActivity(leadId: string, data: {
    type: string;
    content: string;
    userId: string;
  }) {
    return this.prisma.leadActivity.create({
      data: { leadId, type: data.type as never, content: data.content, userId: data.userId },
    });
  }

  async convertToPatient(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    // Verificar se já existe paciente com mesmo telefone
    if (lead.phone) {
      const normalized = this.normalizePhone(lead.phone);
      const existingPatient = await this.prisma.patient.findFirst({
        where: {
          OR: [
            { phoneMain: { contains: normalized } },
            { whatsapp: { contains: normalized } },
          ],
        },
      });

      if (existingPatient) {
        // Vincular lead ao paciente existente em vez de criar duplicado
        await this.prisma.lead.update({
          where: { id },
          data: { patientId: existingPatient.id, status: 'CLOSED_WON' },
        });

        return {
          patient: existingPatient,
          lead: { ...lead, patientId: existingPatient.id, status: 'CLOSED_WON' },
          alreadyExisted: true,
        };
      }
    }

    // Create patient from lead data
    const patient = await this.prisma.patient.create({
      data: {
        name: lead.name,
        phoneMain: lead.phone ?? undefined,
        whatsapp: lead.phone ?? undefined,
        email: lead.email ?? undefined,
        status: 'ATIVO',
      } as never,
    });

    // Link lead to new patient
    await this.prisma.lead.update({
      where: { id },
      data: { patientId: patient.id, status: 'CLOSED_WON' },
    });

    return { patient, lead: { ...lead, patientId: patient.id, status: 'CLOSED_WON' }, alreadyExisted: false };
  }

  async getKpis() {
    const [total, byStage, bySources, pipeline] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.lead.groupBy({ by: ['source'], _count: { id: true } }),
      this.prisma.lead.aggregate({
        where: { status: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'LOYAL'] } },
        _sum: { value: true },
      }),
    ]);

    const won = byStage.find((s) => s.status === 'CLOSED_WON')?._count.id ?? 0;
    const convRate = total > 0 ? Math.round((won / total) * 100) : 0;

    return {
      total,
      won,
      convRate,
      pipeline: pipeline._sum.value ?? 0,
      byStage,
      bySources,
    };
  }
}
