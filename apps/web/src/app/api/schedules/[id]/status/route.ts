import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma, ScheduleStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const data: Prisma.ScheduleUpdateInput = { status: status as ScheduleStatus };
    if (status === 'CONFIRMADO') {
      data.confirmedAt = new Date();
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Schedule status error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
