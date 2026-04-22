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

    const [totalActive, newThisMonth, patientsWithBirthdays] = await Promise.all([
      prisma.patient.count({ where: { status: 'ATIVO' } }),
      prisma.patient.count({
        where: {
          createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
      }),
      prisma.patient.findMany({
        where: {
          birthDate: { gte: today, lt: tomorrow },
        },
        select: { id: true, name: true, birthDate: true },
        take: 10,
      }),
    ]);

    return NextResponse.json({ total: totalActive, newThisMonth, birthdaysToday: patientsWithBirthdays });
  } catch (error) {
    console.error('Patient stats error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
