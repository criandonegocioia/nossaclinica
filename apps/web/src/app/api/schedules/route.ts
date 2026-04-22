import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma, ScheduleStatus } from '@prisma/client';
import { createGoogleEvent, listGoogleEvents } from '@/lib/google-calendar';

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
        professional: { select: { id: true, name: true, avatarUrl: true, googleRefreshToken: true } },
        room: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true, durationDefault: true } },
      },
    });

    let finalSchedules = [...schedules];

    // Fetch Google Calendar events if filtered by professional
    if (professionalId && (startDate || endDate)) {
      const professional = await prisma.user.findUnique({ where: { id: professionalId }, select: { googleRefreshToken: true } });
      if (professional?.googleRefreshToken) {
        try {
          const start = startDate ? new Date(startDate) : new Date();
          const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1));
          
          const googleEvents = await listGoogleEvents(professionalId, start, end);
          
          // Filter out events that are already synced (have a corresponding schedule in DB)
          const syncedGoogleIds = new Set(schedules.map(s => s.googleEventId).filter(Boolean));
          
          const externalEvents = googleEvents
            .filter((ge: any) => !syncedGoogleIds.has(ge.id))
            .map((ge: any) => ({
              id: `google-${ge.id}`,
              patientId: null,
              professionalId,
              roomId: null,
              procedureId: null,
              startAt: new Date(ge.start?.dateTime || ge.start?.date),
              endAt: new Date(ge.end?.dateTime || ge.end?.date),
              status: ScheduleStatus.BLOQUEIO, // Treats external events as blocks
              colorCode: ge.colorId ? undefined : '#6b7280', // Grey if no color
              notes: ge.description,
              isBlock: true,
              googleEventId: ge.id,
              patient: null,
              room: null,
              procedure: { name: ge.summary || 'Evento Externo', colorCode: '#6b7280' },
              professional: { id: professionalId, name: 'Google Agenda' },
            }));

          finalSchedules = [...finalSchedules, ...externalEvents];
        } catch (err) {
          console.error('Falha ao listar eventos do Google Calendar:', err);
        }
      }
    }

    // Sort again just in case
    finalSchedules.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return NextResponse.json(finalSchedules);
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

    // Check external Google Calendar conflict
    const professional = await prisma.user.findUnique({
      where: { id: data.professionalId },
      select: { googleRefreshToken: true }
    });

    if (professional?.googleRefreshToken) {
      try {
        const googleEvents = await listGoogleEvents(data.professionalId, startAt, endAt);
        // Exclude events already in our DB (synced back)
        const existingScheduleIds = await prisma.schedule.findMany({
          where: { googleEventId: { not: null } },
          select: { googleEventId: true }
        });
        const syncedIds = new Set(existingScheduleIds.map(s => s.googleEventId));
        
        const conflictingExternal = googleEvents.find((ge: any) => !syncedIds.has(ge.id));
        if (conflictingExternal) {
          return NextResponse.json({
            message: 'Conflito de horário: profissional possui evento bloqueando no Google Agenda',
          }, { status: 409 });
        }
      } catch (err) {
        console.error('Falha ao verificar conflitos no Google Calendar:', err);
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
        professional: { select: { id: true, name: true, googleRefreshToken: true } },
        room: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true } },
      },
    });

    // Try creating Google Calendar Event
    if (schedule.professional.googleRefreshToken) {
      try {
        const title = schedule.isBlock 
          ? `[Bloqueio] ${schedule.notes || 'Indisponível'}`
          : `Consulta: ${schedule.patient?.name || 'Paciente'} - ${schedule.procedure?.name || 'Atendimento'}`;
          
        const googleEvent = await createGoogleEvent(schedule.professionalId, {
          summary: title,
          description: schedule.notes || '',
          start: schedule.startAt,
          end: schedule.endAt,
          colorId: schedule.isBlock ? '8' : undefined, // 8 is grey in Google Calendar
        });

        if (googleEvent.id) {
          await prisma.schedule.update({
            where: { id: schedule.id },
            data: { googleEventId: googleEvent.id }
          });
        }
      } catch (err) {
        console.error('Falha ao sincronizar com Google Calendar (POST):', err);
      }
    }

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Schedules POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
