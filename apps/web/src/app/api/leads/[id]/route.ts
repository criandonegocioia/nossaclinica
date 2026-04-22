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
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });

    if (!lead) return NextResponse.json({ message: 'Lead não encontrado' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Lead GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await request.json();
    const lead = await prisma.lead.update({ where: { id }, data: data as never });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Lead PATCH error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
