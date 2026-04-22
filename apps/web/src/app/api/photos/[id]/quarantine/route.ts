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
    const photo = await prisma.photo.update({
      where: { id },
      data: { quarantinedAt: new Date() },
    });
    return NextResponse.json(photo);
  } catch (error) {
    console.error('Photo quarantine error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
