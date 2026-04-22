import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokens, JwtPayload } from '@/lib/auth';
import * as argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.active) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    const tokens = await generateTokens(payload);

    // Store refresh token hash
    const refreshHash = await argon2.hash(tokens.refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash },
    });

    return NextResponse.json({
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
