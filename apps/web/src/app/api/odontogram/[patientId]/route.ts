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
    const entries = await prisma.odontogramEntry.findMany({
      where: { patientId },
      orderBy: { toothNumber: 'asc' },
      include: { procedure: { select: { id: true, name: true } } },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Odontogram GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { patientId } = await params;
    const data = await request.json();
    const entry = await prisma.odontogramEntry.create({
      data: { ...data, patientId, createdBy: authResult.user.sub },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Odontogram POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
