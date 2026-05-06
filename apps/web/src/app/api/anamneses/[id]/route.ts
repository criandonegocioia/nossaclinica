import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const anamnesis = await prisma.anamnesis.findUnique({
      where: { id: params.id },
      include: { professional: { select: { id: true, name: true } } },
    });

    if (!anamnesis) {
      return NextResponse.json({ message: 'Anamnese não encontrada' }, { status: 404 });
    }

    return NextResponse.json(anamnesis);
  } catch (error) {
    console.error('Anamnesis GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    // Extract only updateable fields; ignore relational IDs
    const { patientId: _p, professionalId: _pr, id: _id, ...rest } = body;

    const updated = await prisma.anamnesis.update({
      where: { id: params.id },
      data: {
        ...(rest.status !== undefined && { status: rest.status }),
        ...(rest.filledAt !== undefined && { filledAt: new Date(rest.filledAt) }),
        ...(rest.data !== undefined && { data: rest.data }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Anamnesis PATCH error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await prisma.anamnesis.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Anamnesis DELETE error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
