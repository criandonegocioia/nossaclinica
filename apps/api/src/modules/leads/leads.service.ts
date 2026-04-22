import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Create patient from lead data
    const patient = await this.prisma.patient.create({
      data: {
        name: lead.name,
        phoneMain: lead.phone ?? undefined,
        email: lead.email ?? undefined,
        status: 'ATIVO',
      } as never,
    });

    // Link lead to new patient
    await this.prisma.lead.update({
      where: { id },
      data: { patientId: patient.id, status: 'CLOSED_WON' },
    });

    return { patient, lead: { ...lead, patientId: patient.id, status: 'CLOSED_WON' } };
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
