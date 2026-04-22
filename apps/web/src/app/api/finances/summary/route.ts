import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [monthly, lastMonth, pending, overdue, recentPayments] = await Promise.all([
      prisma.finance.aggregate({
        where: {
          status: 'PAGO',
          OR: [
            { paidAt: { gte: startOfMonth } },
            { paidAt: null, createdAt: { gte: startOfMonth } },
          ],
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.finance.aggregate({
        where: {
          status: 'PAGO',
          OR: [
            { paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            { paidAt: null, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.finance.aggregate({
        where: { status: 'PENDENTE' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.finance.count({
        where: { status: 'PENDENTE', dueDate: { lt: now } },
      }),
      prisma.finance.findMany({
        where: {
          status: 'PAGO',
          OR: [
            { paidAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            { paidAt: null, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { paidAt: true, createdAt: true, amount: true },
      }),
    ]);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return { dateStr: d.toISOString().split('T')[0], total: 0, dayIndex: d.getDay() };
    });

    for (const tx of recentPayments) {
      const activeDate = tx.paidAt ?? tx.createdAt;
      const txD = new Date(activeDate.getTime() - activeDate.getTimezoneOffset() * 60000);
      const dateStr = txD.toISOString().split('T')[0];
      const dayBucket = last7Days.find((d) => d.dateStr === dateStr);
      if (dayBucket) dayBucket.total += Number(tx.amount);
    }

    const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const revenueByDay = last7Days.map((d) => d.total);
    const revenueDays = last7Days.map((d) => DAY_NAMES[d.dayIndex]);

    const monthlyRevenue = Number(monthly._sum.amount ?? 0);
    const lastMonthRevenue = Number(lastMonth._sum.amount ?? 0);
    const growthRate = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    return NextResponse.json({
      monthlyRevenue,
      monthlyTransactions: monthly._count.id,
      pendingAmount: Number(pending._sum.amount ?? 0),
      pendingCount: pending._count.id,
      overdueCount: overdue,
      growthRate,
      revenueByDay,
      revenueDays,
    });
  } catch (error) {
    console.error('Finance summary error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
