import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokens, JwtPayload } from '@/lib/auth';
import * as argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, refreshToken } = body;

    if (!userId || !refreshToken) {
      return NextResponse.json({ message: 'userId e refreshToken são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.refreshToken) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 401 });
    }

    const isValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!isValid) {
      return NextResponse.json({ message: 'Token de refresh inválido' }, { status: 401 });
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    const tokens = await generateTokens(payload);

    const refreshHash = await argon2.hash(tokens.refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
