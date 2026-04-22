import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { patientId } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { patientId, quarantinedAt: null };
    if (category) where.category = category;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: where as never,
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { id: true, name: true } },
          procedure: { select: { id: true, name: true } },
        },
      }),
      prisma.photo.count({ where: where as never }),
    ]);

    return NextResponse.json({ data: photos, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Patient photos error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
