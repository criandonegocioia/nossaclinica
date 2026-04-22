import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await request.json();

    const finance = await prisma.finance.update({
      where: { id },
      data: {
        status: data.status as never,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        paymentMethod: data.paymentMethod as never,
      },
    });

    return NextResponse.json(finance);
  } catch (error) {
    console.error('Finance status error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
