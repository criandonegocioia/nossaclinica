import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category as never;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit, orderBy: { name: 'asc' },
        include: {
          batches: { where: { status: { not: 'DEPLETED' } }, orderBy: { expiresAt: 'asc' } },
          _count: { select: { movements: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const enriched = products.map((p) => ({
      ...p,
      currentStock: p.batches.reduce((sum, b) => sum + b.quantity, 0),
    }));

    return NextResponse.json({ data: enriched, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Stock products error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const product = await prisma.product.create({ data: data as Prisma.ProductCreateInput });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
