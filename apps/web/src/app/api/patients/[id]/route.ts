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
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        anamneses: { orderBy: { createdAt: 'desc' }, take: 1 },
        schedules: { orderBy: { startAt: 'desc' }, take: 5 },
        _count: {
          select: {
            medicalRecords: true,
            photos: true,
            documents: true,
            finances: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Patient GET error:', error);
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
    const body = await request.json();

    const patient = await prisma.patient.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Patient PATCH error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
