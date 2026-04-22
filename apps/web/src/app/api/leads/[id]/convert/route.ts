import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ message: 'Lead não encontrado' }, { status: 404 });

    const patient = await prisma.patient.create({
      data: {
        name: lead.name,
        phoneMain: lead.phone ?? undefined,
        email: lead.email ?? undefined,
        status: 'ATIVO',
      } as never,
    });

    await prisma.lead.update({
      where: { id },
      data: { patientId: patient.id, status: 'CLOSED_WON' },
    });

    return NextResponse.json({
      patient,
      lead: { ...lead, patientId: patient.id, status: 'CLOSED_WON' },
    }, { status: 201 });
  } catch (error) {
    console.error('Convert lead error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
