import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const record = await prisma.medicalRecord.findUnique({ where: { id } });

    if (!record) {
      return NextResponse.json({ message: 'Prontuário não encontrado' }, { status: 404 });
    }

    if (!record.isDraft) {
      return NextResponse.json({ message: 'Prontuário já finalizado' }, { status: 400 });
    }

    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: { isDraft: false },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Finalize error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
