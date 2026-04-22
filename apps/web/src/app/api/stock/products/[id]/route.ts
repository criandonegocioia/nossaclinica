import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        batches: { orderBy: { expiresAt: 'asc' } },
        movements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!product) return NextResponse.json({ message: 'Produto não encontrado' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await request.json();
    const product = await prisma.product.update({ where: { id }, data: data as never });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Product PATCH error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
