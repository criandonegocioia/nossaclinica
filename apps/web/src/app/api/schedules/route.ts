import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma, ScheduleStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const where: Prisma.ScheduleWhereInput = {};

    const professionalId = searchParams.get('professionalId');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (professionalId) where.professionalId = professionalId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status as ScheduleStatus;

    if (startDate || endDate) {
      where.startAt = {};
      if (startDate) where.startAt.gte = new Date(startDate);
      if (endDate) where.startAt.lte = new Date(endDate);
    }

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        patient: { select: { id: true, name: true, avatarUrl: true, phoneMain: true } },
        professional: { select: { id: true, name: true, avatarUrl: true } },
        room: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true, durationDefault: true } },
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Schedules GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    // Check for conflicts
    const conflictWhere: Prisma.ScheduleWhereInput = {
      professionalId: data.professionalId,
      status: { notIn: ['CANCELADO', 'FALTOU'] },
      OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
    };

    const conflict = await prisma.schedule.findFirst({ where: conflictWhere });
    if (conflict) {
      return NextResponse.json({
        message: 'Conflito de horário: profissional já possui agendamento neste período',
        conflictingSchedule: conflict.id,
      }, { status: 409 });
    }

    // Check room conflict
    if (data.roomId) {
      const roomConflict = await prisma.schedule.findFirst({
        where: {
          roomId: data.roomId,
          status: { notIn: ['CANCELADO', 'FALTOU'] },
          OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
        },
      });
      if (roomConflict) {
        return NextResponse.json({
          message: 'Conflito de horário: sala já ocupada neste período',
          conflictingSchedule: roomConflict.id,
        }, { status: 409 });
      }
    }

    const colorCode = data.procedureId
      ? (await prisma.procedure.findUnique({ where: { id: data.procedureId } }))?.colorCode
      : undefined;

    const schedule = await prisma.schedule.create({
      data: {
        patientId: data.patientId,
        professionalId: data.professionalId,
        roomId: data.roomId,
        procedureId: data.procedureId,
        startAt,
        endAt,
        notes: data.notes,
        isBlock: data.isBlock || false,
        createdById: authResult.user.sub,
        colorCode,
      },
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true } },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Schedules POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
