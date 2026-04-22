import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const procedures = await prisma.procedure.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Procedures GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const procedure = await prisma.procedure.create({ data: data as never });
    return NextResponse.json(procedure, { status: 201 });
  } catch (error) {
    console.error('Procedures POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
