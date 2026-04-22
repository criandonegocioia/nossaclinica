import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const products = await prisma.product.findMany({
      where: { active: true },
      include: { batches: { where: { status: { not: 'DEPLETED' } } } },
    });

    const total = products.length;
    const expiring = await prisma.batch.count({ where: { status: 'EXPIRING', quantity: { gt: 0 } } });
    const lowStock = products.filter((p) => p.batches.reduce((s, b) => s + b.quantity, 0) < p.minStock).length;
    const empty = products.filter((p) => p.batches.reduce((s, b) => s + b.quantity, 0) === 0).length;

    return NextResponse.json({ total, expiring, lowStock, empty });
  } catch (error) {
    console.error('Stock summary error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
