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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayFilter = { startAt: { gte: today, lt: tomorrow }, isBlock: false };

    const [total, confirmed, pending, completed, missed, revenueResult] = await Promise.all([
      prisma.schedule.count({ where: todayFilter }),
      prisma.schedule.count({ where: { ...todayFilter, status: 'CONFIRMADO' } }),
      prisma.schedule.count({ where: { ...todayFilter, status: 'AGENDADO' } }),
      prisma.schedule.count({ where: { ...todayFilter, status: 'CONCLUIDO' } }),
      prisma.schedule.count({ where: { ...todayFilter, status: 'FALTOU' } }),
      prisma.finance.aggregate({
        where: {
          status: 'PAGO',
          OR: [
            { paidAt: { gte: startOfMonth } },
            { paidAt: null, createdAt: { gte: startOfMonth } },
          ],
        },
        _sum: { amount: true },
      }),
    ]);

    const conversionRate = total > 0 ? Math.round(((completed + confirmed) / total) * 100) : 0;
    const revenue = Number(revenueResult._sum.amount ?? 0);

    return NextResponse.json({
      today: total,
      confirmados: confirmed,
      pending,
      completed,
      missed,
      conversionRate,
      revenue,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
