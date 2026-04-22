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
    const med = await prisma.medication.findUnique({ where: { id } });
    if (!med) return NextResponse.json({ message: 'Medicamento não encontrado' }, { status: 404 });
    return NextResponse.json(med);
  } catch (error) {
    console.error('Medication GET error:', error);
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
    const med = await prisma.medication.update({ where: { id }, data: data as never });
    return NextResponse.json(med);
  } catch (error) {
    console.error('Medication PATCH error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    await prisma.medication.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ message: 'Medicamento desativado' });
  } catch (error) {
    console.error('Medication DELETE error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
