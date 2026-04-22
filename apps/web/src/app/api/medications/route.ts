import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.MedicationWhereInput = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { activeIngredient: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category as never;

    const [data, total] = await Promise.all([
      prisma.medication.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.medication.count({ where }),
    ]);

    return NextResponse.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Medications GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const medication = await prisma.medication.create({ data: data as Prisma.MedicationCreateInput });
    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error('Medications POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
