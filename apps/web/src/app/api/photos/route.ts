import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string;
    const category = formData.get('category') as string || 'OUTRO';
    const medicalRecordId = formData.get('medicalRecordId') as string | null;
    const procedureId = formData.get('procedureId') as string | null;

    if (!file || !patientId) {
      return NextResponse.json({ message: 'Arquivo e paciente são obrigatórios' }, { status: 400 });
    }

    // Store file as base64 in localPath for now (Supabase Storage can be added later)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const photo = await prisma.photo.create({
      data: {
        patientId,
        uploaderId: authResult.user.sub,
        medicalRecordId: medicalRecordId || undefined,
        procedureId: procedureId || undefined,
        category: category as never,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        localPath: dataUrl,
        thumbnailUrl: dataUrl,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
