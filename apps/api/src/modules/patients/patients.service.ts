import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

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
