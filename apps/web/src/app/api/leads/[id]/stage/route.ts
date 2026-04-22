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
    const { stage } = await request.json();
    const lead = await prisma.lead.update({ where: { id }, data: { status: stage as never } });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Lead stage error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
