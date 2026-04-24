import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ScheduleStatus } from '@prisma/client';

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    professionalId?: string;
    roomId?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const where: Prisma.ScheduleWhereInput = {};

    if (params.professionalId) where.professionalId = params.professionalId;
    if (params.roomId) where.roomId = params.roomId;
    if (params.patientId) where.patientId = params.patientId;
    if (params.status) where.status = params.status as ScheduleStatus;

    if (params.startDate || params.endDate) {
      where.startAt = {};
      if (params.startDate) where.startAt.gte = new Date(params.startDate);
      if (params.endDate) where.startAt.lte = new Date(params.endDate);
    }

    return this.prisma.schedule.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        patient: { select: { id: true, name: true, avatarUrl: true, phoneMain: true } },
        professional: { select: { id: true, name: true, avatarUrl: true } },
        room: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true, durationDefault: true } },
      },
    });
  }

  async findById(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        patient: true,
        professional: { select: { id: true, name: true } },
        room: true,
        procedure: true,
      },
    });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');
    return schedule;
  }

  async create(data: {
    patientId?: string;
    professionalId: string;
    roomId?: string;
    procedureId?: string;
    startAt: string;
    endAt: string;
    notes?: string;
    isBlock?: boolean;
    createdById: string;
  }) {
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    // Check for conflicts with the professional
    await this.checkConflicts(data.professionalId, startAt, endAt, data.roomId);

    return this.prisma.schedule.create({
      data: {
        patientId: data.patientId,
        professionalId: data.professionalId,
        roomId: data.roomId,
        procedureId: data.procedureId,
        startAt,
        endAt,
        notes: data.notes,
        isBlock: data.isBlock || false,
        createdById: data.createdById,
        colorCode: data.procedureId
          ? (await this.prisma.procedure.findUnique({ where: { id: data.procedureId } }))?.colorCode
          : undefined,
      },
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true } },
      },
    });
  }

  async updateStatus(id: string, status: ScheduleStatus) {
    const schedule = await this.findById(id);

    const data: Prisma.ScheduleUpdateInput = { status };

    if (status === 'CONFIRMADO') {
      data.confirmedAt = new Date();
    }

    return this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
    });
  }

  async reschedule(id: string, data: { startAt: string; endAt: string; professionalId?: string; roomId?: string; procedureId?: string; notes?: string }) {
    const schedule = await this.findById(id);

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    
    const profId = data.professionalId || schedule.professionalId;
    const rmId = data.roomId || schedule.roomId;

    await this.checkConflicts(profId, startAt, endAt, rmId, id);

    const updateData: Prisma.ScheduleUpdateInput = { 
      startAt, 
      endAt, 
      status: 'AGENDADO', 
    };
    if (profId) updateData.professional = { connect: { id: profId } };
    if (rmId) updateData.room = { connect: { id: rmId } };
    if (data.procedureId) updateData.procedure = { connect: { id: data.procedureId } };
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.schedule.update({
      where: { id },
      data: updateData,
    });
  }

  async getTodaySchedules(professionalId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Prisma.ScheduleWhereInput = {
      startAt: { gte: today, lt: tomorrow },
      isBlock: false,
    };

    if (professionalId) where.professionalId = professionalId;

    return this.prisma.schedule.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        patient: { select: { id: true, name: true, avatarUrl: true, phoneMain: true } },
        professional: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true } },
        room: { select: { id: true, name: true } },
      },
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayFilter = { startAt: { gte: today, lt: tomorrow }, isBlock: false };

    const [total, confirmed, pending, completed, missed, revenueResult] = await Promise.all([
      this.prisma.schedule.count({ where: todayFilter }),
      this.prisma.schedule.count({ where: { ...todayFilter, status: 'CONFIRMADO' } }),
      this.prisma.schedule.count({ where: { ...todayFilter, status: 'AGENDADO' } }),
      this.prisma.schedule.count({ where: { ...todayFilter, status: 'CONCLUIDO' } }),
      this.prisma.schedule.count({ where: { ...todayFilter, status: 'FALTOU' } }),
      this.prisma.finance.aggregate({
        where: { 
          status: 'PAGO', 
          OR: [
            { paidAt: { gte: startOfMonth } },
            { paidAt: null, createdAt: { gte: startOfMonth } }
          ]
        },
        _sum: { amount: true },
      }),
    ]);

    const conversionRate = total > 0 ? Math.round(((completed + confirmed) / total) * 100) : 0;
    const revenue = Number(revenueResult._sum.amount ?? 0);

    return {
      today: total,
      confirmados: confirmed,
      pending,
      completed,
      missed,
      conversionRate,
      revenue,
    };
  }

  private async checkConflicts(
    professionalId: string,
    startAt: Date,
    endAt: Date,
    roomId?: string | null,
    excludeId?: string,
  ) {
    const conflictWhere: Prisma.ScheduleWhereInput = {
      professionalId,
      status: { notIn: ['CANCELADO', 'FALTOU'] },
      OR: [
        { startAt: { lt: endAt }, endAt: { gt: startAt } },
      ],
    };

    if (excludeId) conflictWhere.id = { not: excludeId };

    const professionalConflict = await this.prisma.schedule.findFirst({ where: conflictWhere });

    if (professionalConflict) {
      throw new ConflictException({
        message: 'Conflito de horário: profissional já possui agendamento neste período',
        conflictingSchedule: professionalConflict.id,
      });
    }

    // Check room conflict if room specified
    if (roomId) {
      const roomConflictWhere: Prisma.ScheduleWhereInput = {
        roomId,
        status: { notIn: ['CANCELADO', 'FALTOU'] },
        OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
      };
      if (excludeId) roomConflictWhere.id = { not: excludeId };

      const roomConflict = await this.prisma.schedule.findFirst({ where: roomConflictWhere });
      if (roomConflict) {
        throw new ConflictException({
          message: 'Conflito de horário: sala já ocupada neste período',
          conflictingSchedule: roomConflict.id,
        });
      }
    }
  }
}
