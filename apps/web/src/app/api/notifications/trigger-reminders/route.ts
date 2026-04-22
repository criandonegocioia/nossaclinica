import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Find upcoming appointments (24-25h from now)
    const now = new Date();
    const plus24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const plus25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        status: 'AGENDADO',
        startAt: { gte: plus24Hours, lt: plus25Hours },
      },
      include: { patient: true, professional: true },
    });

    // In production, this would dispatch to a notification queue
    // For now, just return the count of reminders that would be sent
    const count = upcomingSchedules.filter((s) => s.patient).length;

    return NextResponse.json({
      message: `${count} lembretes processados`,
      count,
      schedules: upcomingSchedules.map((s) => ({
        id: s.id,
        patientName: s.patient?.name,
        startAt: s.startAt,
      })),
    });
  } catch (error) {
    console.error('Trigger reminders error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
