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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          professional: { select: { id: true, name: true, avatarUrl: true } },
          photos: { select: { id: true, thumbnailUrl: true, category: true } },
        },
      }),
      prisma.medicalRecord.count({ where: { patientId } }),
    ]);

    return NextResponse.json({ data: records, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Patient records error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
