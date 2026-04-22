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

    const [plans, total] = await Promise.all([
      prisma.treatmentPlan.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          professional: { select: { id: true, name: true } },
          patient: { select: { id: true, name: true } },
        },
      }),
      prisma.treatmentPlan.count({ where }),
    ]);

    return NextResponse.json({ data: plans, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Treatment plans GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const plan = await prisma.treatmentPlan.create({
      data: { ...data, professionalId: data.professionalId || authResult.user.sub } as never,
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Treatment plans POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
