import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.sub },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      avatarUrl: user.avatarUrl,
      permissions: user.role.permissions.map((rp) => rp.permission.name),
      hasGoogleSync: !!user.googleRefreshToken,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
