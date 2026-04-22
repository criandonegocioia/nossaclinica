import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { BatchStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const { productId, quantity, expiresAt, ...rest } = data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ message: 'Produto não encontrado' }, { status: 404 });

    const expiryDate = new Date(expiresAt);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const status: BatchStatus = daysUntilExpiry <= 0 ? 'EXPIRED' : daysUntilExpiry <= 30 ? 'EXPIRING' : 'ACTIVE';

    const batch = await prisma.batch.create({
      data: { ...rest, productId, quantity, initialQty: quantity, expiresAt: expiryDate, status },
    });

    await prisma.stockMovement.create({
      data: { productId, batchId: batch.id, type: 'ENTRY', quantity, reason: `Compra — Lote ${batch.batchNumber}`, userId: authResult.user.sub },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Create batch error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
