import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          professional: { select: { id: true, name: true, avatarUrl: true } },
          photos: { select: { id: true, thumbnailUrl: true, category: true } },
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return NextResponse.json({ data: records, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Medical records GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const record = await prisma.medicalRecord.create({
      data: { ...data, professionalId: data.professionalId || authResult.user.sub },
      include: { professional: { select: { id: true, name: true } } },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Medical records POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
