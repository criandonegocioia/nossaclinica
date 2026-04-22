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
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const [med, anamnesis] = await Promise.all([
      prisma.medication.findUnique({ where: { id } }),
      patientId ? prisma.anamnesis.findFirst({ where: { patientId }, orderBy: { createdAt: 'desc' } }) : null,
    ]);

    if (!med) return NextResponse.json({ message: 'Medicamento não encontrado' }, { status: 404 });

    const allergies: string[] = (anamnesis?.data as Record<string, string[]>)?.allergies ?? [];
    const warnings: string[] = [];

    if (med.contraindications) {
      const contraWords = med.contraindications.toLowerCase().split(/[,;.\s]+/);
      for (const allergy of allergies) {
        if (contraWords.some((w) => allergy.toLowerCase().includes(w))) {
          warnings.push(`Paciente alérgico a "${allergy}" — contraindicação: ${med.contraindications}`);
        }
      }
    }

    return NextResponse.json({ hasWarnings: warnings.length > 0, warnings, medication: med });
  } catch (error) {
    console.error('Interactions error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
