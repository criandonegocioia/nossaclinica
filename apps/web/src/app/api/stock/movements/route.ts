import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const { productId, quantity, type } = data;

    if (['EXIT', 'ADJUSTMENT', 'EXPIRED', 'RETURN'].includes(type)) {
      const batches = await prisma.batch.findMany({
        where: { productId, status: { not: 'DEPLETED' } },
      });
      const totalStock = batches.reduce((s, b) => s + b.quantity, 0);
      if (quantity > totalStock) {
        return NextResponse.json({
          message: `Estoque insuficiente. Disponível: ${totalStock}, Solicitado: ${quantity}`,
        }, { status: 400 });
      }

      let remaining = quantity;
      const sortedBatches = batches.sort(
        (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      );
      for (const batch of sortedBatches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        const newQty = batch.quantity - deduct;
        await prisma.batch.update({
          where: { id: batch.id },
          data: { quantity: newQty, status: newQty === 0 ? 'DEPLETED' : batch.status },
        });
        remaining -= deduct;
      }
    }

    const movement = await prisma.stockMovement.create({
      data: {
        productId, batchId: data.batchId, type: type as never, quantity,
        reason: data.reason, patientId: data.patientId, hofRecordId: data.hofRecordId,
        userId: authResult.user.sub,
      },
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Stock movement error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
