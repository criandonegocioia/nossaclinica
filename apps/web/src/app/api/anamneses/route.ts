import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;

    const [data, total] = await Promise.all([
      prisma.anamnesis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { professional: { select: { id: true, name: true } } },
      }),
      prisma.anamnesis.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Anamneses GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const anamnesis = await prisma.anamnesis.create({ data: data as never });
    return NextResponse.json(anamnesis, { status: 201 });
  } catch (error) {
    console.error('Anamneses POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
