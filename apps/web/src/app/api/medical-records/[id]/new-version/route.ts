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
    const updates = await request.json();

    const original = await prisma.medicalRecord.findUnique({
      where: { id },
      include: { patient: { select: { id: true, name: true } }, professional: { select: { id: true, name: true } } },
    });

    if (!original) {
      return NextResponse.json({ message: 'Prontuário não encontrado' }, { status: 404 });
    }

    if (original.isDraft) {
      return NextResponse.json({ message: 'Rascunhos podem ser editados diretamente' }, { status: 400 });
    }

    const newVersion = await prisma.medicalRecord.create({
      data: {
        patientId: original.patientId,
        professionalId: authResult.user.sub,
        scheduleId: original.scheduleId,
        complaint: updates.complaint ?? original.complaint,
        diagnosis: updates.diagnosis ?? original.diagnosis,
        treatmentPlan: updates.treatmentPlan ?? original.treatmentPlan,
        procedures: updates.procedures ?? original.procedures,
        prescriptions: updates.prescriptions ?? original.prescriptions,
        orientations: updates.orientations ?? original.orientations,
        complications: updates.complications ?? original.complications,
        professionalSignature: updates.professionalSignature ?? original.professionalSignature,
        isDraft: false,
        previousVersionId: id,
      },
    });

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error('New version error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
