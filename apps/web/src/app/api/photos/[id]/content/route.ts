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
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) return NextResponse.json({ message: 'Foto não encontrada' }, { status: 404 });

    if (photo.localPath?.startsWith('data:')) {
      const [header, base64] = photo.localPath.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const buffer = Buffer.from(base64, 'base64');
      return new NextResponse(buffer, {
        headers: { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=31536000' },
      });
    }

    return NextResponse.json({ message: 'Arquivo não disponível' }, { status: 404 });
  } catch (error) {
    console.error('Photo content error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
