import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [expiringBatches, allProducts] = await Promise.all([
      prisma.batch.findMany({
        where: { expiresAt: { lte: thirtyDaysFromNow }, status: { in: ['ACTIVE', 'EXPIRING'] }, quantity: { gt: 0 } },
        include: { product: true },
        orderBy: { expiresAt: 'asc' },
      }),
      prisma.product.findMany({
        where: { active: true },
        include: { batches: { where: { status: { not: 'DEPLETED' } } } },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => {
      const stock = p.batches.reduce((s, b) => s + b.quantity, 0);
      return stock > 0 && stock < p.minStock;
    });

    const emptyProducts = allProducts.filter((p) =>
      p.batches.reduce((s, b) => s + b.quantity, 0) === 0,
    );

    return NextResponse.json({ expiringBatches, lowStockProducts, emptyProducts });
  } catch (error) {
    console.error('Stock alerts error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
