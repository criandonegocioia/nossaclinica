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
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { phoneMain: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as 'ATIVO' | 'INATIVO' | 'ARQUIVADO';
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          schedules: {
            where: { startAt: { gte: new Date() } },
            orderBy: { startAt: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      data: patients,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Patients GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const patient = await prisma.patient.create({
      data: { ...body, createdBy: authResult.user.sub },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Patients POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
