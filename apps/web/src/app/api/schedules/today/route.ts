import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await prisma.schedule.findMany({
      where: { startAt: { gte: today, lt: tomorrow }, isBlock: false },
      orderBy: { startAt: 'asc' },
      include: {
        patient: { select: { id: true, name: true, avatarUrl: true, phoneMain: true } },
        professional: { select: { id: true, name: true } },
        procedure: { select: { id: true, name: true, colorCode: true } },
        room: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Today schedules error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
