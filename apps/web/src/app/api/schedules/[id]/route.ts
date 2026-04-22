import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        patient: true,
        professional: { select: { id: true, name: true } },
        room: true,
        procedure: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Schedule GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
