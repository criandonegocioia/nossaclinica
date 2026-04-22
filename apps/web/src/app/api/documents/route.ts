import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || undefined;
    const type = searchParams.get('type') || undefined;

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (type && type !== 'all') where.type = type;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { id: true, name: true, cpf: true } } },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const doc = await prisma.document.create({
      data: {
        type: body.type,
        title: body.title || `Documento - ${body.type}`,
        content: JSON.stringify(body.content),
        patientId: body.patientId,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
