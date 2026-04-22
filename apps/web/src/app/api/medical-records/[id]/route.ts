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
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        professional: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
        photos: true,
      },
    });

    if (!record) {
      return NextResponse.json({ message: 'Prontuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Medical record GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
