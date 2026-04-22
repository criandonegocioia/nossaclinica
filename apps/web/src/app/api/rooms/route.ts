import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const rooms = await prisma.room.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Rooms GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const room = await prisma.room.create({ data: data as never });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Rooms POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
