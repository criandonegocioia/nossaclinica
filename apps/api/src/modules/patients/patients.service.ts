import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normaliza telefone removendo tudo que não é dígito.
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { phoneMain: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as 'ATIVO' | 'INATIVO' | 'ARQUIVADO';
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          schedules: {
            where: { startAt: { gte: new Date() } },
            orderBy: { startAt: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        anamneses: { orderBy: { createdAt: 'desc' }, take: 1 },
        schedules: { orderBy: { startAt: 'desc' }, take: 5 },
        _count: {
          select: {
            medicalRecords: true,
            photos: true,
            documents: true,
            finances: true,
          },
        },
      },
    });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async create(data: Prisma.PatientCreateInput) {
    const cpf = (data as any).cpf as string | undefined;
    const phoneMain = (data as any).phoneMain as string | undefined;
    const whatsapp = (data as any).whatsapp as string | undefined;
    const phone = phoneMain || whatsapp;

    // 1. Dedup por CPF (match exato, já é unique no banco)
    if (cpf) {
      const byCpf = await this.prisma.patient.findUnique({ where: { cpf } });
      if (byCpf) {
        throw new ConflictException({
          message: `Já existe paciente com este CPF: "${byCpf.name}"`,
          existingId: byCpf.id,
          existingName: byCpf.name,
          matchedBy: 'CPF',
        });
      }
    }

    // 2. Dedup por telefone
    if (phone) {
      const normalized = this.normalizePhone(phone);
      const byPhone = await this.prisma.patient.findFirst({
        where: {
          OR: [
            { phoneMain: { contains: normalized } },
            { whatsapp: { contains: normalized } },
          ],
        },
      });

      if (byPhone) {
        throw new ConflictException({
          message: `Já existe paciente com este telefone: "${byPhone.name}"`,
          existingId: byPhone.id,
          existingName: byPhone.name,
          matchedBy: 'PHONE',
        });
      }
    }

    return this.prisma.patient.create({ data });
  }

  async update(id: string, data: Prisma.PatientUpdateInput) {
    return this.prisma.patient.update({ where: { id }, data });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalActive, newThisMonth, patientsWithBirthdays] = await Promise.all([
      this.prisma.patient.count({ where: { status: 'ATIVO' } }),
      this.prisma.patient.count({
        where: {
          createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
      }),
      this.prisma.patient.findMany({
        where: {
          birthDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          id: true,
          name: true,
          birthDate: true,
        },
        take: 10,
      }),
    ]);

    return { total: totalActive, newThisMonth, birthdaysToday: patientsWithBirthdays };
  }
}
