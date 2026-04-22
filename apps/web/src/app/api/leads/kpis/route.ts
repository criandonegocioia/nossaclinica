import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const [total, byStage, bySources, pipeline] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.lead.groupBy({ by: ['source'], _count: { id: true } }),
      prisma.lead.aggregate({
        where: { status: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'LOYAL'] } },
        _sum: { value: true },
      }),
    ]);

    const won = byStage.find((s) => s.status === 'CLOSED_WON')?._count.id ?? 0;
    const convRate = total > 0 ? Math.round((won / total) * 100) : 0;

    return NextResponse.json({
      total, won, convRate,
      pipeline: pipeline._sum.value ?? 0,
      byStage, bySources,
    });
  } catch (error) {
    console.error('Leads KPIs error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
