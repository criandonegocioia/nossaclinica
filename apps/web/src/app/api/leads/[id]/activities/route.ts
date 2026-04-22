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
    const data = await request.json();

    const activity = await prisma.leadActivity.create({
      data: { leadId: id, type: data.type as never, content: data.content, userId: authResult.user.sub },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Lead activity error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
