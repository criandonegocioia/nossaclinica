import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { updateGoogleEvent } from '@/lib/google-calendar';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);

    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
    }

    if (schedule.startAt < new Date()) {
      return NextResponse.json({ message: 'Não é possível alterar ou remarcar agendamentos que já ocorreram no passado.' }, { status: 403 });
    }

    if (startAt < new Date()) {
      return NextResponse.json({ message: 'A nova data de agendamento não pode estar no passado.' }, { status: 400 });
    }

    // Check conflicts
    const conflictWhere: Prisma.ScheduleWhereInput = {
      professionalId: schedule.professionalId,
      id: { not: id },
      status: { notIn: ['CANCELADO', 'FALTOU'] },
      OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
    };

    const conflict = await prisma.schedule.findFirst({ where: conflictWhere });
    if (conflict) {
      return NextResponse.json({
        message: 'Conflito de horário',
        conflictingSchedule: conflict.id,
      }, { status: 409 });
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: { startAt, endAt, status: 'AGENDADO' },
      include: { professional: { select: { id: true, googleRefreshToken: true } } },
    });

    if (updated.googleEventId && updated.professional.googleRefreshToken) {
      try {
        await updateGoogleEvent(updated.professionalId, updated.googleEventId, {
          start: updated.startAt,
          end: updated.endAt,
          status: 'confirmed',
        });
      } catch (err) {
        console.error('Falha ao atualizar Google Calendar no reschedule:', err);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Reschedule error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
